# Power Platform Advisor Agent

Comprehensive engineering reference for building, operating, and scaling a Power Platform Advisor agent across ALM, environments, Copilot Studio, Power Apps, Dataverse, Power Automate, MCP, and governance.

This document is designed as both a build guide and an operational runbook for solution teams, platform engineering, and CoE administrators.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Topics Inventory](#topics-inventory)
5. [ALM (Application Lifecycle Management)](#alm-application-lifecycle-management)
6. [Environment Strategy](#environment-strategy)
7. [Copilot Studio Agents](#copilot-studio-agents)
8. [Power Apps](#power-apps)
9. [Custom Connectors](#custom-connectors)
10. [Dataverse](#dataverse)
11. [Agent Flows (Power Automate)](#agent-flows-power-automate)
12. [MCP (Model Context Protocol)](#mcp-model-context-protocol)
13. [Custom Topics](#custom-topics)
14. [Power Fx](#power-fx)
15. [Variables](#variables)
16. [Platform Features](#platform-features)
17. [Operational Playbooks](#operational-playbooks)
18. [Reference Commands](#reference-commands)
19. [Glossary](#glossary)
20. [Change Log Template](#change-log-template)

## Quick Start

### 1) Clone and branch
```bash
git clone https://github.com/dayour/Copilot-Agent-Development.git
cd Copilot-Agent-Development
git checkout -b feat/power-platform-advisor-readme
```

### 2) Validate Power Platform CLI
```bash
pac auth create --environment https://<org>.crm.dynamics.com
pac org who
pac solution list
```

### 3) Validate Copilot Studio dependencies
```bash
# Verify solution-aware authoring strategy
pac solution list --json
# Optionally enumerate agents if pac agent extension is available
pac agent list
```

### 4) Establish CI/CD baseline
```yaml
# GitHub Actions skeleton
name: pp-alm
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Power Platform CLI
        run: dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### 5) Publish and observe
1. Publish agent updates from Copilot Studio.
2. Run smoke tests for topics, tools, and authentication paths.
3. Review analytics for trigger coverage, tool call success, and escalation rate.

## Prerequisites

| Category | Requirement | Why it matters | Validation command or check |
|---|---|---|---|
| Identity | Microsoft Entra ID tenant access | Required for auth, SSO, and app registrations | Portal access + app registration permission |
| Licensing | Copilot Studio, Power Apps, Power Automate licensing | Enables premium connectors and production use | Power Platform admin center licensing view |
| Environment | Dev/Test/Prod environments | Enables ALM promotion and safe release | pac org list |
| CLI | Power Platform CLI (pac) | Required for automation and CI/CD | pac --version |
| Source Control | GitHub repository access | Versioned agent, app, and solution assets | git ls-remote origin |
| Security | DLP policy admin alignment | Prevents prohibited data movement | Admin center DLP policy review |
| Monitoring | Analytics and logging destination | Tracks quality and operations | Copilot Studio analytics + optional App Insights |
| Integration | Connector credentials and secrets | Required for external API and MCP tools | Connection references resolve without prompts |

## Architecture

### Logical architecture
```text
+-----------------------------------------------------------------------------------+
|                                Power Platform Advisor                             |
|                           (Copilot Studio Agent Runtime)                          |
+--------------------------+--------------------------+-----------------------------+
                           |                          |
                           v                          v
               +----------------------+      +-----------------------+
               | Topic Orchestration  |      | Generative Orchestrator|
               | (Custom + System)    |      | (Knowledge + Tools)   |
               +----------+-----------+      +-----------+-----------+
                          |                              |
                          v                              v
          +-------------------------------+   +-------------------------------+
          | Agent Flows / Power Automate |   | MCP Tools / Custom Connectors |
          +----------------------+--------+   +---------------+---------------+
                                 |                            |
                                 v                            v
                     +--------------------+      +----------------------------+
                     | Dataverse          |      | External APIs / Services   |
                     | Tables, Security   |      | REST, Graph, LOB systems   |
                     +--------------------+      +----------------------------+
                                 |                            |
                                 v                            v
                +--------------------------------------------------------------+
                | Knowledge Sources: SharePoint, Files, Websites, Dataverse   |
                +--------------------------------------------------------------+
                                 |
                                 v
                +--------------------------------------------------------------+
                | Channels: Teams, Web, SharePoint, Omnichannel, M365         |
                +--------------------------------------------------------------+
                                 |
                                 v
                +--------------------------------------------------------------+
                | Governance Layer: DLP, Security Roles, Env Strategy, ALM     |
                +--------------------------------------------------------------+
```

### Operational data flow
- User asks an intent in a channel (for example Teams).
- Orchestrator selects a topic, tool, or knowledge source based on description and context.
- Topic gathers required parameters (or orchestrator auto-prompts for missing tool inputs).
- Agent invokes flow, connector, MCP tool, prompt, or HTTP action.
- Result is transformed via Power Fx and variable mapping.
- Response returns with citation, adaptive card, or deterministic message.
- Telemetry is captured in analytics for route quality and failure diagnostics.

## Topics Inventory

| Domain | Proposed Topic Name | Trigger examples | Primary tools | Expected outputs |
|---|---|---|---|---|
| ALM | Assess Solution Promotion Readiness | promote solution, import managed, release check | Dataverse, flow, pac references | Readiness report with blockers |
| Environment Strategy | Select Environment for Workload | where should this app live, sandbox or prod | Policy lookup, capacity check | Environment recommendation |
| Copilot Studio | Design Agent Orchestration | design agent routing, topic structure | Topic templates, tool descriptions | Architecture + topic map |
| Power Apps | Recommend App Pattern | canvas vs model-driven, mobile app | Dataverse schema analyzer | Pattern decision with tradeoffs |
| Custom Connectors | Create Connector Blueprint | build connector from swagger | OpenAPI validator | Connector checklist + auth design |
| Dataverse | Model Dataverse Schema | design tables and relationships | Schema helper | Table/relationship blueprint |
| Agent Flows | Build Topic to Flow Contract | flow inputs from topic, return value | Flow template | Input/output mapping |
| MCP | Bind MCP Server to Agent | connect mcp server | MCP registry | Server binding plan |
| Custom Topics | Author Topic YAML | write topic yaml | Code editor workflow | Validated YAML skeleton |
| Power Fx | Generate Power Fx Formulas | power fx parse json, formula help | Formula snippets | Typed formula pack |
| Variables | Refactor Variable Scope | topic vs global variable | Variable linter | Scope and naming refactor plan |
| Platform Features | Configure GenAI and Knowledge | set knowledge sources, configure generative | Knowledge manager | Feature configuration matrix |

## ALM (Application Lifecycle Management)

### Scope and objective
Establish predictable release governance for Power Platform assets using solution-aware development, managed promotion, and repeatable automation.

### Core concepts
- Use unmanaged solutions in development and managed solutions in test/production to preserve controlled customization boundaries.
- Understand solution layering: base managed layer, patch layer, and top unmanaged customizations that can shadow managed components.
- Use versioning semantics intentionally (major.minor.build.revision) and align import strategy with patch or upgrade operations.
- Prefer solution upgrades when deprecating components; use patches only for incremental, compatible changes.
- Store unpacked solution artifacts in source control for diff-friendly pull requests.
- Treat connection references and environment variables as first-class ALM assets.
- Include Copilot Studio assets (agent, topics, tools, flows) inside solutions to avoid drift.
- Implement pre-deployment validation: solution checker, dependency check, and test automation gates.
- Use deployment settings JSON for environment-specific mapping in pipelines.
- Plan rollback with previous managed version retention and data migration reversibility.

### Implementation patterns
1. Branch-per-feature with pull-request review on unpacked solution folders.
2. Release branch locks where only pipeline identity can import to production.
3. Managed-only production environment with blocked unmanaged customization.
4. Patch cadence for urgent fixes, periodic cumulative upgrade to reset patch count.
5. Pipeline stages: build, static checks, deploy to test, automated agent evaluation, gated prod deploy.
6. Artifact immutability: same managed zip promoted from test to prod.

### Commands and concrete examples
```bash
pac solution export --name Contoso_Core --path out/Contoso_Core_managed.zip --managed true
pac solution export --name Contoso_Core --path out/Contoso_Core_unmanaged.zip --managed false
pac solution unpack --zipfile out/Contoso_Core_unmanaged.zip --folder src/solutions/Contoso_Core --processCanvasApps
pac solution pack --zipfile out/Contoso_Core_unmanaged.zip --folder src/solutions/Contoso_Core --packagetype Unmanaged
pac solution checker --path out/Contoso_Core_unmanaged.zip --ruleSet SolutionChecker
pac solution import --path out/Contoso_Core_managed.zip --activate-plugins --publish-changes
pac solution online-version --solution-name Contoso_Core --solution-version 2.3.0.0
```

### Anti-patterns to avoid
- Editing directly in production unmanaged layer.
- Importing unmanaged solutions into production for convenience.
- Skipping dependency validation before import.
- Hardcoding endpoint URLs or secrets into flows and topics.
- Rebuilding artifacts per stage instead of promoting immutable build outputs.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Managed deployment target | Prevents accidental direct edits | Admin center + solution details |
| Version increments are consistent | Enables deterministic upgrades | Inspect solution version in source and environment |
| Connection references resolved | Avoids runtime connector failures | Run post-deploy smoke flow |
| Environment variables mapped | Supports multi-environment portability | Verify deployment settings mapping |
| Solution checker clean | Catches quality and compatibility risks | Pipeline checker report |
| Rollback package retained | Reduces production recovery time | Release artifact retention policy |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Environment Strategy

### Scope and objective
Design tenant-level environment topology that balances isolation, compliance, and delivery speed.

### Core concepts
- Default environment is for personal productivity and should not host enterprise production workloads.
- Developer environments provide maker-isolated spaces for experimentation and branch-aligned work.
- Sandbox environments support destructive testing, copy/restore operations, and integration validation.
- Production environments are controlled, audited, and restricted to managed deployment flows.
- Trial environments are time-limited and must not hold regulated business data.
- Security groups restrict who can access each environment and reduce accidental maker sprawl.
- DLP policies should classify connectors into business, non-business, and blocked classes.
- Capacity planning must include Dataverse database, file, and log consumption projections.
- Geo strategy should align data residency requirements with environment region placement.
- CoE toolkit provides tenant-wide visibility for app inventory, connector usage, and compliance posture.

### Implementation patterns
1. Three-tier baseline (Dev/Test/Prod) with per-team developer environments.
2. Data segregation by business unit when legal or operational boundaries require it.
3. Dedicated integration sandbox for connector and API contract testing.
4. Tenant-level policy-as-code documentation for DLP and environment roles.
5. Regional environment placement map maintained with legal and security stakeholders.

### Commands and concrete examples
```bash
pac admin list-environments
pac org who
pac org select --environment https://<org>-dev.crm.dynamics.com
pac org select --environment https://<org>-test.crm.dynamics.com
pac org select --environment https://<org>-prod.crm.dynamics.com
```

### Anti-patterns to avoid
- Single shared environment for all development and production workloads.
- No security group scoping on sensitive environments.
- Allowing unrestricted premium connectors without DLP review.
- Ignoring capacity growth until storage hard limits are reached.
- Cross-geo deployment without explicit residency approval.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Environment purpose documented | Reduces misuse | Environment catalog review |
| Security groups configured | Limits access blast radius | Admin center environment settings |
| DLP policy assigned | Prevents non-compliant data movement | DLP policy assignment matrix |
| Capacity threshold alerts | Prevents operational outages | Capacity analytics and alerts |
| Regional compliance confirmed | Meets data residency obligations | Legal/compliance sign-off |
| CoE telemetry active | Enables governance insights | CoE dashboard health |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Copilot Studio Agents

### Scope and objective
Build agents that use robust instructions, topic architecture, tools, and analytics for reliable outcomes.

### Core concepts
- Use generative orchestration when tool descriptions and topic descriptions are curated and disambiguated.
- Model selection should align with latency, cost, and quality targets for the scenario.
- Instructions should follow a three-part structure: mission, boundaries, and execution policy.
- System topics should be customized for error, escalation, sign-in, and fallback behavior.
- Publishing strategy should include controlled channel rollout and post-publish smoke tests.
- Connected agents and child agents should have clear ownership and explicit handoff contracts.
- Analytics must be reviewed for trigger quality, resolution rate, escalation rate, and tool failure clusters.
- Use topic input/output parameters to reduce over-reliance on global variables.
- Document every tool with clear name and description to improve orchestrator selection quality.
- Stay inside platform limits: up to 128 topics and 8,000 characters of agent instructions.

### Implementation patterns
1. Instruction template: Role statement, Do/Do-not boundaries, Response contract.
2. Description-first authoring for topics and tools in generative mode.
3. Canary publish to one channel before global channel release.
4. Weekly analytics review with top failed utterances and remedial topic updates.
5. Explicit escalation topic with transcript summary and context payload.

### Commands and concrete examples
```bash
pac agent list
pac agent create --name PowerPlatformAdvisor --solution Contoso_Core
pac agent export --name PowerPlatformAdvisor --path out/agent
pac agent import --path out/agent --solution Contoso_Core
```

### Anti-patterns to avoid
- Using vague tool names like 'Tool1' and 'ConnectorAction'.
- Overloading a single topic with unrelated intents.
- Ignoring system topic customization for authentication and error fallback.
- Publishing directly to all channels without staged validation.
- Treating analytics as optional post-launch work.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Instruction length under platform limit | Prevents save/publish errors | Character count check before publish |
| Topic count under limit | Maintains platform compatibility | Topic inventory export |
| Descriptions are unambiguous | Improves route selection | Peer review against overlap matrix |
| Fallback topic tested | Improves user recovery path | Simulated unknown-intent tests |
| Channel auth validated | Avoids sign-in loops | End-to-end channel test |
| Analytics baseline captured | Enables improvement trend analysis | Export first-week metrics |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Power Apps

### Scope and objective
Guide design and lifecycle management for canvas and model-driven applications integrated with the advisor ecosystem.

### Core concepts
- Canvas apps prioritize task-centric UX and flexible layouts for role-specific experiences.
- Model-driven apps prioritize data model consistency, security, and process-centric navigation.
- Use components and component libraries to enforce UI consistency and reduce duplication.
- PCF controls provide pro-code extensibility for advanced UX and custom behavior.
- Responsive design requires breakpoint-aware containers, relative sizing, and test matrices across form factors.
- Offline capability needs explicit cache strategy, conflict resolution, and sync diagnostics.
- Application sharing should use groups and least-privilege roles rather than broad user grants.
- Application lifecycle should be solution-aware and versioned with release notes.
- Use telemetry where possible to identify slow screens, failed submits, and adoption drop-off.
- For enterprise apps, define support tiers and ownership for every app artifact.

### Implementation patterns
1. Canvas app for guided advisor workflow, model-driven app for admin and data stewardship.
2. Shared component library for navigation shell, message bars, and error surfaces.
3. PCF only where native controls cannot satisfy accessibility or functional requirements.
4. Offline-ready task list patterns with incremental sync and retry queue.
5. Role-based app assignment through security groups and Dataverse roles.

### Commands and concrete examples
```bash
pac canvas list
pac canvas download --name <AppName> --path out/canvas
pac canvas unpack --msapp src/app.msapp --sources src/app-src
pac canvas pack --sources src/app-src --msapp out/app.msapp
pac pcf init --namespace Contoso --name AdvisorControl --template field
pac pcf push --publisher-prefix cts
```

### Anti-patterns to avoid
- Single massive canvas app attempting every business function.
- Hardcoded color and sizing values without design tokens.
- PCF use for trivial scenarios that native controls already handle.
- Ignoring offline conflict handling in field/mobile scenarios.
- Directly sharing apps with individual users at scale.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| App type justified | Prevents architecture mismatch | Decision record for canvas vs model-driven |
| Component reuse implemented | Improves maintainability | Component usage inventory |
| Accessibility reviewed | Meets usability requirements | Keyboard and screen reader validation |
| Offline strategy tested | Ensures resilience | Airplane mode scenario test |
| Security roles validated | Protects data | Role matrix test by persona |
| Lifecycle in solution | Enables ALM | App artifacts inside managed solution |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Custom Connectors

### Scope and objective
Create enterprise-ready connectors with strong contracts, secure auth, and predictable runtime behavior.

### Core concepts
- Author OpenAPI specifications with explicit schemas, examples, response codes, and operation summaries.
- Use OAuth2 for delegated access when user context is required; use API key only for service-level patterns with vault-backed secret management.
- Define pagination explicitly using continuation token or page/size fields and document limits.
- Use policy templates and custom code only when transformation cannot be handled in flow logic.
- Classify connectors under DLP and document business/non-business impact.
- Create separate operations for read vs write responsibilities to simplify user confirmation in agent tooling.
- Include trigger operations only when event-driven integration is required and reliable webhook support exists.
- Plan certification path if connector will be distributed beyond internal tenant use.
- Document throttling, retry-after semantics, and idempotency behavior.
- Use test harnesses for schema regression when backend APIs evolve.

### Implementation patterns
1. Version OpenAPI contract and enforce review on every schema change.
2. Use named examples for every operation to improve maker usability.
3. OAuth2 authorization code with PKCE for user-delegated enterprise APIs.
4. Request/response normalization at connector boundary for downstream simplicity.
5. Centralized error object format across all operations.

### Commands and concrete examples
```bash
pac connector init --api-def api/openapi.yaml --icon assets/icon.png
pac connector create --environment <env-url>
pac connector update --environment <env-url>
pac connector list
```

### Anti-patterns to avoid
- Publishing connector with undocumented auth prerequisites.
- Returning loosely typed or inconsistent JSON across similar operations.
- Ignoring pagination and forcing clients to fetch one page only.
- Mixing business and consumer data connectors without DLP governance.
- Embedding secrets in examples or sample payloads.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| OpenAPI validates | Prevents connector import issues | lint + import test |
| Authentication tested | Avoids runtime auth failures | Connection creation in target env |
| DLP classification approved | Supports compliance | Policy review ticket |
| Pagination contract documented | Prevents truncation bugs | Load test with >1 page |
| Error schema stable | Improves troubleshooting | Contract test suite |
| Certification path defined | Supports external reuse | Publisher readiness checklist |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Dataverse

### Scope and objective
Design durable data models with correct relationships, security, and performance characteristics.

### Core concepts
- Model tables around business capabilities, not UI screens.
- Define columns with explicit data types, constraints, and naming conventions.
- Use one-to-many, many-to-one, and many-to-many relationships with clear ownership semantics.
- Use choices (option sets) for governed enumerations and ensure lifecycle for new values.
- Leverage calculated and rollup columns for deterministic derived values.
- Use business rules for client/server-side validation that does not require code.
- Understand polymorphic lookups when one reference can target multiple entity types.
- Virtual tables expose external data without physically storing it in Dataverse.
- Elastic tables support high-scale throughput scenarios with partition-aware design.
- Apply least privilege with security roles, teams, and field-level security profiles.

### Implementation patterns
1. Normalized core tables plus denormalized reporting projections where needed.
2. Explicit alternate keys for integration-safe upsert behavior.
3. Field-level security on sensitive columns (PII, salary, classification levels).
4. Partition strategy for elastic tables based on natural high-cardinality key.
5. Virtual tables for read-heavy systems where replication is undesirable.

### Commands and concrete examples
```bash
pac dataverse list
pac data export --schemaFile schema.json --output out/data
pac solution unpack --zipfile out/Core.zip --folder src/solutions/Core
pac solution pack --zipfile out/Core.zip --folder src/solutions/Core --packagetype Managed
```

### Anti-patterns to avoid
- Using text columns for structured identifiers that require validation and indexing.
- Duplicating reference data in multiple tables instead of choices/reference tables.
- Allowing broad org-level read/write roles by default.
- Creating circular relationship dependencies without clear delete behavior.
- Ignoring view optimization for common filtered access patterns.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Schema naming convention applied | Improves maintainability | Metadata review |
| Security roles tested | Protects business data | Persona-based access tests |
| Relationships documented | Prevents data integrity errors | ERD validation |
| Calculated/rollup logic verified | Ensures numerical accuracy | Sample record evaluation |
| Virtual/elastic fit validated | Avoids wrong storage architecture | Performance and cost review |
| Indexes and keys defined | Improves query performance | Query profile and key checks |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Agent Flows (Power Automate)

### Scope and objective
Implement flow contracts that can be safely called from topics and orchestration paths.

### Core concepts
- Use 'When an agent calls the flow' trigger for topic-driven execution.
- Return deterministic outputs through 'Respond to the agent' for predictable topic mapping.
- Handle errors with scoped try/catch patterns using parallel branches and terminate actions.
- Use asynchronous patterns for long-running work (respond quickly, continue post-response when supported).
- Approval flows should include timeout strategy and escalation fallback.
- HTTP actions must include retry and timeout boundaries with explicit status handling.
- Use Dataverse connector actions with least-privilege connections.
- Use child flows for reusable domain operations to avoid duplication.
- Track correlation IDs across topic and flow logs for troubleshooting.
- Document every flow input contract and output schema with examples.

### Implementation patterns
1. Input contract with required vs optional fields and defaulting policy.
2. Structured output object (status, data, error) returned to topic layer.
3. HTTP action wrapped in retry policy and response code switch.
4. Approval action with timeout branch and status telemetry.
5. Child flow library for common Dataverse CRUD operations.

### Commands and concrete examples
```bash
pac flow list
pac flow export --environment <env-url> --path out/flows
pac flow import --environment <env-url> --path out/flows
```

### Anti-patterns to avoid
- Returning free-form text when topic expects typed fields.
- Unbounded parallel loops that trigger connector throttling.
- No timeout handling for external HTTP dependencies.
- Embedding environment-specific URLs directly in actions.
- Copy/paste duplicate logic across many flows.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Trigger and response actions present | Required for agent integration | Flow designer inspection |
| Output schema stable | Prevents topic mapping breaks | Contract test run |
| Error branch implemented | Improves resilience | Forced-failure simulation |
| Connection references abstracted | Supports ALM portability | Import to test environment |
| Child flow reuse applied | Reduces maintenance cost | Flow dependency graph |
| Timeouts documented | Avoids hung requests | Run history duration analysis |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## MCP (Model Context Protocol)

### Scope and objective
Bind standardized MCP servers to the agent to expand tool coverage with controlled semantic routing.

### Core concepts
- Register MCP servers in Copilot Studio settings and verify discovered tools/resources.
- Tool definitions should include precise names, descriptions, and typed input contracts.
- Semantic routing quality depends on tool metadata quality and overlap minimization.
- Bind only necessary servers to limit tool noise and reduce orchestrator ambiguity.
- Use server-side versioning to evolve tools without breaking existing agent behavior.
- Track tool invocation success and latency as first-class operational metrics.
- Define fallback topics for MCP server timeout or unavailable routes.
- Keep authentication and network topology documented for each server endpoint.
- Segment server access by environment to avoid accidental production calls from dev agents.
- Maintain an approved server catalog for ecosystem consistency.

### Implementation patterns
1. One MCP server per capability domain (for example: docs, ticketing, telemetry).
2. Strict input schema and validation before tool execution.
3. Server health probe before publish in critical channels.
4. Topic-level fallback messaging when MCP call fails.
5. Tool naming convention includes domain and action verb.

### Commands and concrete examples
```bash
# Example MCP inspector usage
npx @modelcontextprotocol/inspector
# Verify local registration where applicable
odr.exe list
```

### Anti-patterns to avoid
- Adding overlapping tools with near-identical descriptions.
- No environment scoping for MCP endpoints.
- Assuming MCP tools can be deterministically invoked from classic topics without orchestration.
- Ignoring authentication expiration behavior.
- No operational ownership for MCP server reliability.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Server discovery succeeds | Confirms binding validity | Tool list visible in agent settings |
| Tool metadata quality reviewed | Improves routing | Description overlap audit |
| Fallback path exists | Protects user experience | Simulated server outage test |
| Env-specific endpoints used | Prevents cross-environment calls | Configuration review |
| Invocation telemetry captured | Supports optimization | Analytics dashboard |
| Ownership documented | Ensures operational response | Runbook with on-call mapping |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Custom Topics

### Scope and objective
Author robust topic graphs in visual canvas and YAML code editor with predictable parameter flow.

### Core concepts
- Use at least four diverse trigger phrases per topic in classic mode to improve intent matching.
- In generative mode, topic description quality matters more than trigger phrase volume.
- Use node types intentionally: SendActivity, Question, ConditionGroup, SetVariable, HttpRequest, BeginDialog.
- Prefer shallow branching; avoid deeply nested paths beyond three levels where possible.
- Define topic inputs/outputs so data can flow across topic redirects without global state overuse.
- Use code editor workflow for repeatable YAML review in source control.
- Validate YAML syntax and semantic references before publishing.
- Add deterministic fallback response when required entity extraction fails.
- Use standard naming conventions for nodes and variables for maintainability.
- Attach test utterance sets to each topic for regression checks.

### Implementation patterns
1. Topic per intent with single responsibility and explicit success/failure exits.
2. Node IDs and variable names follow predictable naming pattern.
3. BeginDialog for reusable subdialog style interactions.
4. Question nodes with retry and validation for critical inputs.
5. ConditionGroup branches by status code and confidence values.

### Commands and concrete examples
```bash
# Pseudo workflow
# 1. Open topic in code editor
# 2. Edit YAML
# 3. Validate
# 4. Save and test
```

### Anti-patterns to avoid
- One topic trying to implement an entire business process end-to-end.
- Relying on generic trigger phrases such as 'help' for domain-specific topics.
- Unvalidated HttpRequest output mapped directly to user-visible response.
- Opaque node naming that blocks code review readability.
- No test coverage for alternate branch conditions.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Minimum trigger coverage | Improves match reliability | At least four diversified trigger phrases |
| YAML validates | Prevents authoring errors | Save + test panel run |
| Variable flow documented | Reduces hidden state bugs | Topic map review |
| Branch outcomes tested | Improves resilience | Path coverage matrix |
| Redirect I/O configured | Supports modular topics | Input/output parameter test |
| Fallback branch present | Improves user recovery | Unknown input test |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

### YAML template example
```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRecognizedIntent
  id: main
  intent:
    displayName: Advisor.Topic.ALMAssessment
    triggerQueries:
      - assess solution readiness
      - check managed import blockers
      - validate release pipeline
      - run alm governance review
  actions:
    - kind: SendActivity
      id: send_intro
      activity: Let's evaluate your ALM readiness.
    - kind: Question
      id: q_env
      variable: Topic.TargetEnvironment
      prompt: Which environment is the target (test or production)?
    - kind: SetVariable
      id: set_context
      variable: Topic.RequestedAt
      value: =Now()
    - kind: HttpRequest
      id: get_checks
      method: Get
      url: =Environment.AlmAssessmentApi & "/checks?env=" & Topic.TargetEnvironment
    - kind: ConditionGroup
      id: by_status
      conditions:
        - id: status_ok
          condition: =Topic.get_checks.statusCode = 200
          actions:
            - kind: BeginDialog
              id: begin_report
              dialog: Advisor.Topic.RenderAssessment
      elseActions:
        - kind: SendActivity
          id: send_error
          activity: I could not retrieve checks. Please retry or escalate.
```

## Power Fx

### Scope and objective
Use Power Fx for deterministic transformation, validation, and response shaping across topics and flows.

### Core concepts
- Power Fx supports scalar, record, and table types with formula-first composition.
- Use With() and Let-style composition patterns for readable complex formulas.
- Use Text/Value/DateValue conversions explicitly at integration boundaries.
- Use ParseJSON for untyped JSON and cast values before arithmetic or comparisons.
- Use If, Switch, Coalesce for clear condition handling and defaults.
- Use IsBlank and IsEmpty correctly based on scalar vs table context.
- Use Error, IfError, and IsError patterns for robust fault-tolerant formulas.
- Use table shaping functions (AddColumns, DropColumns, ShowColumns, RenameColumns) for predictable output schemas.
- Avoid deeply nested formulas by splitting logic into intermediate variables.
- Document assumptions for locale-dependent parsing and formatting.

### Implementation patterns
1. Centralize repeated formulas in reusable pattern snippets and topic templates.
2. Normalize API response records before branching to keep condition expressions simple.
3. Use Coalesce to provide stable defaults for optional fields.
4. Perform numeric conversions once and store typed variable.
5. Apply DateAdd/DateDiff with explicit timezone assumptions.

### Commands and concrete examples
```bash
# Sample formulas
# Convert and guard
Set(Topic.Quantity, Value(Topic.QuantityText));
Set(Topic.Total, Round(Value(Topic.Price) * Topic.Quantity, 2));
# Parse JSON
Set(Topic.Payload, ParseJSON(Topic.RawJson));
# Conditional
Set(Topic.Risk, If(Topic.Total > 10000, "High", "Standard"));
```

### Anti-patterns to avoid
- Comparing numeric values before conversion from text.
- Using ParseJSON output directly without typing/casting.
- Relying on implicit locale parsing for currency and dates.
- Embedding long formulas directly into message nodes without intermediate variables.
- Ignoring IfError around external data parsing.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Type conversion explicit | Avoids runtime formula errors | Formula review |
| JSON parsing guarded | Prevents null/cast failures | Malformed payload test |
| Condition logic readable | Improves maintainability | Peer review for complexity |
| Error handling present | Improves resilience | Intentional failure test |
| Variable names semantic | Improves debugging | Naming convention lint |
| Locale assumptions documented | Prevents regional bugs | Cross-locale test |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

### Power Fx function quick reference

| Category | Functions | Usage notes |
|---|---|---|
| Text | Text, Concatenate, Left, Right, Mid, Lower, Upper, Trim, Substitute | Format and normalize user-facing output |
| Number | Value, Round, RoundDown, RoundUp, Abs, Sum, Average | Convert and aggregate numeric values |
| Date/Time | Now, Today, DateValue, DateAdd, DateDiff, Text | Use explicit formatting and timezone assumptions |
| Table | Filter, Sort, AddColumns, ShowColumns, DropColumns, First, Last | Shape records before branching or rendering |
| Logical | If, Switch, And, Or, Not, Coalesce | Prefer readable branching over nested expressions |
| Error | IfError, IsError, Error | Wrap risky operations and return fallback |
| JSON | ParseJSON, JSON | Cast untyped values when using ParseJSON |

## Variables

### Scope and objective
Implement variable governance so topics remain modular, testable, and portable across environments.

### Core concepts
- Topic variables are local and should hold transient state for one topic execution.
- Global variables persist for the conversation and should be used sparingly for cross-topic context.
- System variables provide channel and runtime metadata and are read-only.
- User variables become available after successful sign-in and should be treated as identity context.
- Environment variables are deployment-time configuration values and should hold endpoints, keys, and feature flags.
- Prefer topic input/output parameters over global variable coupling.
- Apply naming convention with scope prefix for clarity (Topic.*, Global.*, Environment.*).
- Initialize defaults explicitly to avoid null branch ambiguity.
- Clear global variables at logical conversation boundaries when values are no longer needed.
- Document variable contracts in each topic header comment.

### Implementation patterns
1. Variable contract table maintained per topic for inputs, outputs, and defaults.
2. Global variable review in PR to prevent accidental state coupling.
3. Environment variables with deployment settings per stage.
4. Identity variables used only after authentication branch success.
5. Cross-topic redirects carrying explicit I/O mappings.

### Commands and concrete examples
```bash
# Example Power Fx variable operations
Set(Topic.OrderId, Topic.InputOrderId);
Set(Global.CurrentScenario, "ALM");
Set(Topic.IsAuthenticated, User.IsLoggedIn);
Set(Topic.ChannelName, System.Channel.Name);
Set(Topic.ApiBaseUrl, Environment.AdvisorApiBaseUrl);
```

### Anti-patterns to avoid
- Using global variable as a hidden dependency for most topics.
- Reusing variable names with different data types across topics.
- Treating system variables as writable.
- Embedding environment-specific values as literals.
- Not clearing stale global values after route changes.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Scope choice justified | Reduces hidden dependencies | Topic variable map review |
| I/O mapping explicit | Supports modularity | Redirect contract test |
| Environment values externalized | Improves portability | Deployment settings check |
| User/system variables read-only usage | Avoids logic errors | Formula lint pass |
| Defaults initialized | Prevents null branch bugs | Test with empty inputs |
| Variable naming standard | Improves readability | Static review checklist |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

### Variable passing between topics

1. Source topic gathers data and validates required fields.
2. Source topic redirects to destination topic with input mapping.
3. Destination topic marks corresponding question variables as Receive values.
4. Destination topic computes outputs and marks Return values.
5. Source topic consumes returned output variables for final response.

| Variable Type | Example | Write access | Typical usage |
|---|---|---|---|
| Topic | Topic.OrderId | Yes | Per-topic interaction state |
| Global | Global.CustomerTier | Yes | Cross-topic session context |
| System | System.Channel.Name | No | Channel-aware behavior |
| User | User.DisplayName | No | Personalization and audit context |
| Environment | Environment.AdvisorApiBaseUrl | No (runtime) | Deployment configuration |

## Platform Features

### Scope and objective
Configure high-impact Copilot Studio capabilities with clear limits, tradeoffs, and governance controls.

### Core concepts
- Generative AI settings determine how orchestration routes between topics, tools, and knowledge.
- Knowledge sources can include SharePoint, uploaded files, websites, and Dataverse-backed data.
- Adaptive cards provide structured interaction surfaces for richer responses.
- AI Builder integration can add extraction, classification, and model-based decisions.
- Skills and connected agents allow composable capability growth across teams.
- Orchestrator behavior depends heavily on clear descriptions, input metadata, and prior context.
- Respect platform limits: 128 topics and 8,000-character agent instruction budget.
- Use confidence and fallback strategy to prevent low-quality hallucinated responses.
- Apply user confirmation for sensitive tool actions (writes, approvals, irreversible operations).
- Implement observability per capability to support rapid issue localization.

### Implementation patterns
1. Enable generative orchestration with curated topic/tool descriptions.
2. Knowledge source ownership model with freshness SLA and review cadence.
3. Adaptive card templates for approval, summary, and next-step interactions.
4. AI Builder model lifecycle with periodic quality re-evaluation.
5. Skills catalog with defined contracts and owning teams.

### Commands and concrete examples
```bash
# Representative configuration actions are primarily UI-driven in Copilot Studio
# Track settings in architecture decision records and solution docs
```

### Anti-patterns to avoid
- Enabling too many overlapping knowledge sources without relevance tuning.
- Using adaptive cards with inconsistent schema versions and no fallback text.
- Treating model output as authoritative without guardrails.
- No limit awareness leading to topic sprawl and instruction overflow.
- No ownership for stale knowledge source refresh.

### Validation checklist
| Check | Why | How to validate |
|---|---|---|
| Generative settings reviewed | Controls orchestration quality | Config review with sample prompts |
| Knowledge source freshness SLA | Prevents stale answers | Scheduled review job |
| Adaptive card validation | Improves channel compatibility | Card schema + channel test |
| AI Builder quality monitored | Ensures model utility | Precision/recall review cadence |
| Limit compliance tracked | Avoids platform ceiling issues | Topic/instruction inventory |
| Fallback behavior tested | Improves reliability | Unknown query and tool failure tests |

### Troubleshooting guidance
- If deployment fails, capture exact error code, correlation id, and affected component name.
- If behavior differs by environment, diff environment variables, connection references, and security roles.
- If runtime output is unexpected, isolate with minimal reproducible topic path and deterministic test utterance set.
- If permissions are suspected, validate service principals, app users, and role assignments in target environment.
- If throttling appears, inspect connector limits, retry policy, and request burst profile in flow runs.

## Operational Playbooks

### Release Playbook
1. Freeze changes and branch lock for release candidate.
2. Run solution checker and static validation pipeline.
3. Deploy managed package to test and execute regression suite.
4. Run agent evaluation batch and channel smoke tests.
5. Capture sign-off from platform owner and security reviewer.
6. Promote same managed artifact to production.
7. Monitor first-hour telemetry and define rollback checkpoint.

### Incident Playbook
1. Classify incident by impact: routing error, tool failure, auth failure, data quality issue.
2. Capture correlation IDs from topic run and flow run histories.
3. Switch to fallback message path if user-facing reliability is degraded.
4. Rollback solution if regression is confirmed.
5. Communicate status and ETA to support channels.
6. Document root cause and preventive action.

### Quality Playbook
1. Curate weekly set of failed utterances from analytics.
2. Map each failure to topic/tool/knowledge defect class.
3. Add or refine topic descriptions and trigger coverage.
4. Update tool descriptions and input metadata.
5. Re-run targeted regression set and compare improvement.
6. Publish change summary with measurable quality delta.

## Reference Commands

### PAC CLI
```bash
pac auth create --environment https://<org>.crm.dynamics.com
pac org who
pac solution list
pac solution export --name <SolutionName> --path out/<SolutionName>_managed.zip --managed true
pac solution unpack --zipfile out/<SolutionName>_unmanaged.zip --folder src/solutions/<SolutionName>
pac solution checker --path out/<SolutionName>_unmanaged.zip --ruleSet SolutionChecker
pac flow list
pac agent list
```

### GitHub Actions deployment skeleton
```yaml
name: power-platform-release
on:
  workflow_dispatch:
  push:
    branches: [ main ]
jobs:
  build-and-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - name: Install PAC
        run: dotnet tool install --global Microsoft.PowerApps.CLI.Tool
      - name: Export managed solution artifact
        run: pac solution export --name Contoso_Core --path out/Contoso_Core_managed.zip --managed true
      - name: Run checker
        run: pac solution checker --path out/Contoso_Core_managed.zip --ruleSet SolutionChecker
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: managed-solution
          path: out/Contoso_Core_managed.zip
```

## Glossary

| Term | Definition |
|---|---|
| Managed solution | Deployable package intended for controlled downstream environments. |
| Unmanaged solution | Editable package used primarily in development environments. |
| Solution layering | Runtime composition of base managed, patches, and unmanaged customizations. |
| Connection reference | Indirection object that binds solution components to environment-specific connections. |
| Environment variable | Configuration asset used to externalize values like endpoint URLs and secrets. |
| Generative orchestration | LLM-driven selection across topics, tools, and knowledge sources. |
| MCP | Model Context Protocol for exposing tools and resources to model-driven agents. |
| PCF | Power Apps Component Framework for custom client-side controls. |
| Elastic table | Dataverse table type optimized for high-scale throughput scenarios. |
| Virtual table | Dataverse table projection over external data without physical storage in Dataverse. |

## Change Log Template

```markdown
## YYYY-MM-DD
- Area: ALM | Environments | Copilot Studio | Apps | Connectors | Dataverse | Flows | MCP
- Change: <what changed>
- Reason: <why>
- Risk: Low | Medium | High
- Validation: <tests executed>
- Rollback: <how to revert>
```

## Domain Conversation Catalog

### ALM conversation playbook

| Item | Guidance |
|---|---|
| ALM scenario 01 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 02 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 03 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 04 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 05 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 06 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 07 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 08 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 09 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 10 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 11 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 12 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 13 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 14 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 15 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 16 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 17 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 18 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 19 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 20 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 21 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 22 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 23 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 24 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| ALM scenario 25 | Assess Solution Promotion Readiness - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Environment Strategy conversation playbook

| Item | Guidance |
|---|---|
| Environment Strategy scenario 01 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 02 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 03 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 04 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 05 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 06 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 07 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 08 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 09 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 10 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 11 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 12 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 13 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 14 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 15 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 16 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 17 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 18 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 19 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 20 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 21 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 22 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 23 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 24 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Environment Strategy scenario 25 | Select Environment for Workload - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Copilot Studio conversation playbook

| Item | Guidance |
|---|---|
| Copilot Studio scenario 01 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 02 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 03 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 04 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 05 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 06 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 07 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 08 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 09 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 10 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 11 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 12 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 13 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 14 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 15 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 16 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 17 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 18 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 19 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 20 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 21 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 22 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 23 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 24 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Copilot Studio scenario 25 | Design Agent Orchestration - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Power Apps conversation playbook

| Item | Guidance |
|---|---|
| Power Apps scenario 01 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 02 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 03 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 04 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 05 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 06 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 07 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 08 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 09 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 10 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 11 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 12 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 13 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 14 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 15 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 16 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 17 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 18 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 19 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 20 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 21 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 22 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 23 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 24 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Apps scenario 25 | Recommend App Pattern - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Custom Connectors conversation playbook

| Item | Guidance |
|---|---|
| Custom Connectors scenario 01 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 02 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 03 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 04 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 05 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 06 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 07 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 08 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 09 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 10 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 11 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 12 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 13 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 14 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 15 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 16 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 17 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 18 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 19 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 20 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 21 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 22 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 23 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 24 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Connectors scenario 25 | Create Connector Blueprint - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Dataverse conversation playbook

| Item | Guidance |
|---|---|
| Dataverse scenario 01 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 02 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 03 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 04 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 05 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 06 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 07 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 08 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 09 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 10 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 11 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 12 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 13 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 14 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 15 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 16 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 17 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 18 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 19 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 20 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 21 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 22 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 23 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 24 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Dataverse scenario 25 | Model Dataverse Schema - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Agent Flows conversation playbook

| Item | Guidance |
|---|---|
| Agent Flows scenario 01 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 02 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 03 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 04 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 05 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 06 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 07 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 08 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 09 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 10 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 11 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 12 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 13 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 14 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 15 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 16 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 17 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 18 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 19 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 20 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 21 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 22 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 23 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 24 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Agent Flows scenario 25 | Build Topic to Flow Contract - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### MCP conversation playbook

| Item | Guidance |
|---|---|
| MCP scenario 01 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 02 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 03 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 04 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 05 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 06 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 07 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 08 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 09 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 10 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 11 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 12 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 13 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 14 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 15 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 16 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 17 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 18 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 19 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 20 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 21 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 22 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 23 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 24 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| MCP scenario 25 | Bind MCP Server to Agent - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Custom Topics conversation playbook

| Item | Guidance |
|---|---|
| Custom Topics scenario 01 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 02 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 03 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 04 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 05 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 06 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 07 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 08 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 09 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 10 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 11 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 12 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 13 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 14 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 15 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 16 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 17 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 18 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 19 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 20 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 21 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 22 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 23 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 24 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Custom Topics scenario 25 | Author Topic YAML - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Power Fx conversation playbook

| Item | Guidance |
|---|---|
| Power Fx scenario 01 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 02 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 03 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 04 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 05 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 06 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 07 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 08 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 09 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 10 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 11 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 12 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 13 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 14 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 15 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 16 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 17 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 18 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 19 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 20 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 21 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 22 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 23 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 24 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Power Fx scenario 25 | Generate Power Fx Formulas - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Variables conversation playbook

| Item | Guidance |
|---|---|
| Variables scenario 01 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 02 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 03 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 04 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 05 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 06 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 07 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 08 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 09 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 10 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 11 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 12 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 13 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 14 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 15 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 16 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 17 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 18 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 19 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 20 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 21 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 22 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 23 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 24 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Variables scenario 25 | Refactor Variable Scope - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

### Platform Features conversation playbook

| Item | Guidance |
|---|---|
| Platform Features scenario 01 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 02 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 03 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 04 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 05 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 06 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 07 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 08 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 09 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 10 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 11 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 12 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 13 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 14 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 15 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 16 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 17 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 18 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 19 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 20 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 21 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 22 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 23 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 24 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |
| Platform Features scenario 25 | Configure GenAI and Knowledge - Ask for context, identify constraints, propose implementation path, produce validation steps, and include rollback guidance. |

## Governance Matrices

### ALM governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| ALM control 01 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 02 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 03 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 04 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 05 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 06 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 07 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 08 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 09 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 10 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 11 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 12 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 13 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 14 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| ALM control 15 | Define and document policy-aligned implementation for assess solution promotion readiness. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Environment Strategy governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Environment Strategy control 01 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 02 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 03 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 04 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 05 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 06 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 07 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 08 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 09 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 10 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 11 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 12 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 13 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 14 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Environment Strategy control 15 | Define and document policy-aligned implementation for select environment for workload. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Copilot Studio governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Copilot Studio control 01 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 02 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 03 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 04 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 05 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 06 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 07 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 08 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 09 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 10 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 11 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 12 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 13 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 14 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Copilot Studio control 15 | Define and document policy-aligned implementation for design agent orchestration. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Power Apps governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Power Apps control 01 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 02 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 03 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 04 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 05 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 06 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 07 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 08 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 09 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 10 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 11 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 12 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 13 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 14 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Apps control 15 | Define and document policy-aligned implementation for recommend app pattern. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Custom Connectors governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Custom Connectors control 01 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 02 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 03 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 04 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 05 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 06 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 07 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 08 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 09 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 10 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 11 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 12 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 13 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 14 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Connectors control 15 | Define and document policy-aligned implementation for create connector blueprint. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Dataverse governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Dataverse control 01 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 02 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 03 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 04 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 05 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 06 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 07 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 08 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 09 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 10 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 11 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 12 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 13 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 14 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Dataverse control 15 | Define and document policy-aligned implementation for model dataverse schema. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Agent Flows governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Agent Flows control 01 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 02 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 03 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 04 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 05 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 06 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 07 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 08 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 09 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 10 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 11 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 12 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 13 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 14 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Agent Flows control 15 | Define and document policy-aligned implementation for build topic to flow contract. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### MCP governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| MCP control 01 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 02 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 03 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 04 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 05 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 06 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 07 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 08 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 09 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 10 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 11 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 12 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 13 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 14 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| MCP control 15 | Define and document policy-aligned implementation for bind mcp server to agent. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Custom Topics governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Custom Topics control 01 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 02 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 03 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 04 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 05 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 06 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 07 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 08 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 09 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 10 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 11 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 12 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 13 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 14 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Custom Topics control 15 | Define and document policy-aligned implementation for author topic yaml. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Power Fx governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Power Fx control 01 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 02 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 03 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 04 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 05 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 06 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 07 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 08 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 09 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 10 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 11 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 12 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 13 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 14 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Power Fx control 15 | Define and document policy-aligned implementation for generate power fx formulas. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Variables governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Variables control 01 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 02 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 03 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 04 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 05 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 06 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 07 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 08 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 09 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 10 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 11 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 12 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 13 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 14 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Variables control 15 | Define and document policy-aligned implementation for refactor variable scope. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

### Platform Features governance matrix

| Control | Requirement | Evidence | Frequency | Owner |
|---|---|---|---|---|
| Platform Features control 01 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 02 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 03 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 04 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 05 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 06 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 07 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 08 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 09 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 10 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 11 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 12 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 13 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 14 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |
| Platform Features control 15 | Define and document policy-aligned implementation for configure genai and knowledge. | Design record, pipeline log, and runtime telemetry. | Monthly | Platform Engineering |

