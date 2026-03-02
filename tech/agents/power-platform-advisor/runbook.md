# Power Platform Advisor Agent Deployment Runbook

## Document Control

| Field | Value |
|---|---|
| Runbook Owner | Power Platform Engineering |
| Repository | `dayour/Copilot-Agent-Development` |
| Target File | `tech/agents/power-platform-advisor/runbook.md` |
| Deployment Targets | Dev, Test, UAT, Production |
| Last Updated | 2026-03-02 |
| Change Type | Initial baseline deployment runbook |

## 0. Deployment Flow Summary

```text
Source Control (GitHub)
  -> Validate YAML and solution artifacts
  -> Provision environment and enforce DLP
  -> Import managed solution and map environment variables
  -> Configure agent instructions, knowledge, connectors, MCP
  -> Deploy topics and validate trigger coverage
  -> Configure authentication and channels
  -> Publish and execute post-deployment matrix
  -> Monitor KPIs, alerts, and rollback readiness
```

## 1. Prerequisites

### 1.1 Required Licenses

| License SKU | Minimum Role Coverage | Why Required | Verification Command or Path |
|---|---|---|---|
| Power Apps Premium | Makers and service accounts | Dataverse access and solution-aware app/runtime execution | Power Platform Admin Center -> Billing -> Licenses |
| Power Automate Premium | Flow owners and service principals | Cloud flows, premium connectors, child flow support | Power Platform Admin Center -> Licenses |
| Copilot Studio | Agent authors and publishers | Agent authoring, topic management, and publishing | Microsoft 365 admin center -> Licenses |
| Microsoft 365 E3 or E5 | Knowledge source and Teams channel users | Teams integration and SharePoint access for grounding | Microsoft 365 admin center |
| Dataverse Database Capacity Add-on | Tenant level | Ensures sufficient DB/storage capacity for solution import | Power Platform Admin Center -> Capacity |
| Dataverse File Capacity Add-on | Tenant level when attachments used | Supports knowledge artifacts and large payloads | Power Platform Admin Center -> Capacity |
| AI Credits / Copilot Capacity | Tenant or environment | Supports generative responses and orchestration workload | Power Platform Admin Center -> AI credits |

### 1.2 Required Tools

| Tool | Minimum Version | Install Command | Verification Command | Purpose |
|---|---|---|---|---|
| Power Platform CLI (pac) | latest stable | `winget install Microsoft.PowerAppsCLI` | `pac --version` | Solution import/export, auth profiles, deployment automation |
| GitHub CLI (gh) | 2.40+ | `winget install GitHub.cli` | `gh --version` | Repository API operations and automated file updates |
| copilotbrowser-cli | latest | `npm install -g @copilot/browser-cli` | `copilotbrowser --version` | Automated UI validation and evidence capture |
| Node.js LTS | 20.x | `winget install OpenJS.NodeJS.LTS` | `node --version` and `npm --version` | YAML linting, scripting, CLI dependencies |
| Python | 3.11+ | `winget install Python.Python.3.11` | `python --version` | Validation scripts, test matrix automation, reporting |
| PowerShell | 7.4+ | `winget install Microsoft.PowerShell` | `pwsh --version` | Automation orchestration and deployment scripts |
| VS Code | latest | `winget install Microsoft.VisualStudioCode` | `code --version` | Code editor for topic YAML and configuration files |

### 1.3 Required Permissions

| Scope | Role | Required? | Why | Verification |
|---|---|---|---|---|
| Tenant | Power Platform Admin | Required for prod lead | Create environments, apply DLP, review capacity | Admin Center -> Roles |
| Environment | Environment Admin | Required | Import solutions, configure security, publish agent | Environment -> Access |
| Environment | System Customizer | Required | Modify tables, flows, and metadata | Environment -> Users + Teams |
| Environment | Copilot Studio Author | Required | Create/edit agent instructions and topics | Copilot Studio -> Security |
| Environment | Copilot Studio Publisher | Required | Publish to channels and manage release state | Copilot Studio -> Security |
| Dataverse | Basic User + table permissions | Required | Runtime access to business tables and logs | Dataverse security roles |
| Teams | Teams Admin or delegated approver | Conditional | Enable Teams channel and SSO app permissions | Teams Admin Center |
| Entra ID | Application Administrator | Required for app registrations | Configure SSO and API permissions | Entra Admin Center -> Roles |
| SharePoint | Site Collection Admin (target sites) | Required for grounding owners | Authorize docs source indexing | SharePoint Admin Center |
| GitHub | Repo write access | Required | Create and update runbook and deployment artifacts | Repository settings -> collaborators |

### 1.4 Network and Firewall Requirements

| Endpoint Class | Examples | Port/Protocol | Direction | Purpose |
|---|---|---|---|---|
| Power Platform services | `*.crm.dynamics.com`, `*.powerapps.com`, `*.powerautomate.com` | 443/TCP | Outbound | Dataverse and automation APIs |
| Copilot Studio services | `*.copilotstudio.microsoft.com`, `*.powerva.microsoft.com` | 443/TCP | Outbound | Agent authoring and publishing |
| Microsoft Graph | `graph.microsoft.com` | 443/TCP | Outbound | Identity and Microsoft 365 integration |
| SharePoint Online | `*.sharepoint.com` | 443/TCP | Outbound | Knowledge source indexing |
| Azure OpenAI / model endpoints | tenant specific endpoint | 443/TCP | Outbound | Generative model invocation |
| GitHub API | `api.github.com`, `github.com` | 443/TCP | Outbound | Runbook and pipeline artifact management |
| Connector backends | organization API domains | 443/TCP | Outbound | Custom connector runtime calls |

### 1.5 Pre-Flight Checks
1. Confirm all required licenses are assigned to deployment and service accounts.
2. Confirm PAC auth profile can list environments.
3. Confirm target environment region satisfies data residency requirements.
4. Confirm DLP policy baseline exists for the target environment group.
5. Confirm all required secrets are in approved secret store (not in source control).
6. Confirm outbound access to SharePoint and model endpoint URLs.
7. Confirm Teams app policy allows custom app or tenant app deployment.
8. Confirm change window approval and rollback approver on call.
9. Confirm monitoring dashboard access for operations team.
10. Confirm incident bridge and distribution list are prepared.

## 2. Environment Provisioning

### 2.1 Create or Select Target Dataverse Environment

Use a managed environment for all non-dev and production workloads.

```bash
pac auth create --url https://orgname.crm.dynamics.com --name pp-prod
pac auth select --name pp-prod
pac org who
pac env list
```

Provisioning checklist:
- [ ] 1. Select existing managed environment if it already has governance controls.
- [ ] 2. If creating new environment, align region to data residency policy.
- [ ] 3. Enable Dataverse database during creation.
- [ ] 4. Tag environment with owner, cost center, and lifecycle metadata.
- [ ] 5. Enable managed environment controls: sharing limits, maker welcome, and insights.
- [ ] 6. Add deployment pipeline service principal to environment security group.

### 2.2 Configure DLP Policies

| Policy | Scope | Business Connectors | Non-Business Connectors | Blocked Connectors | Validation |
|---|---|---|---|---|---|
| DLP-Prod-Strict | Production environments | Dataverse, Office 365 Users, SharePoint, Microsoft Teams | Azure DevOps (if approved), HTTP with Entra ID | Twitter, Dropbox personal, Gmail | Run DLP impact analysis and connector inventory review |
| DLP-UAT-Controlled | UAT environments | Same as production plus approved test endpoints | HTTP custom connectors to staging | Consumer connectors | Validate no production data egress |
| DLP-Dev-Managed | Developer environments | Dataverse, test connectors, development APIs | HTTP to dev APIs | Unapproved external SaaS | Weekly CoE governance review |

DLP deployment steps:
- Create or update policy in Power Platform Admin Center.
- Assign policy to environment or environment group.
- Run impact analysis before enforcement.
- Capture connector exceptions with business justification.
- Export policy configuration for audit retention.

### 2.3 Set Up Security Groups

| Security Group | Member Type | Assigned Roles | Notes |
|---|---|---|---|
| PP-Advisor-Admins | Platform engineers | Environment Admin, System Administrator | Limited membership, PIM recommended |
| PP-Advisor-Makers | Agent authors | System Customizer, Copilot Author | No direct production publish rights |
| PP-Advisor-Publishers | Release engineers | Copilot Publisher, Environment Maker | Responsible for release approvals |
| PP-Advisor-Readers | Support and analytics | Read-only roles + analytics access | Used for monitoring and triage |
| PP-Advisor-ServiceAccounts | Service principals and bot identities | App user roles with least privilege | No interactive sign-in where possible |

### 2.4 Verify Capacity and Region

| Check | Target | Command or Path | Pass Criteria |
|---|---|---|---|
| Dataverse DB capacity | Sufficient free GB for solution + growth | Power Platform Admin Center -> Capacity | At least 20% free post-import |
| File capacity | Sufficient for knowledge artifacts and logs | Power Platform Admin Center -> Capacity | No projected exhaustion within 90 days |
| API request capacity | Service account baseline and peak | Power Platform Admin Center -> Analytics | No sustained throttling risk |
| Region alignment | Approved region list | Environment details | Matches compliance region policy |
| Managed environment status | Enabled in test and prod | Environment settings | Managed controls active |

## 3. Solution Import

### 3.1 PAC CLI Import Sequence

```bash
pac auth select --name pp-prod
pac org who
pac solution list
pac solution import --path ./solutions/PowerPlatformAdvisor_managed.zip --publish-changes --async
pac solution check --path ./solutions/PowerPlatformAdvisor_managed.zip --outputDirectory ./artifacts/solution-check
pac solution list
```

If import fails, capture detailed logs:

```bash
pac solution import --path ./solutions/PowerPlatformAdvisor_managed.zip --publish-changes --async --max-async-wait-time 120
```

### 3.2 Environment Variable Mapping

| Variable Name | Type | Example Value (Dev) | Example Value (Prod) | Required | Component Dependency | Verification Step |
|---|---|---|---|---|---|---|
| ppadvisor_DataverseUrl | Text | https://org-dev.crm.dynamics.com | https://org-prod.crm.dynamics.com | Yes | All Dataverse connectors and flows | Open connection references and test connection |
| ppadvisor_EnvironmentId | Text | dev-env-guid | prod-env-guid | Yes | Telemetry and diagnostics | Run health check topic |
| ppadvisor_TenantId | Text | entra-tenant-guid | entra-tenant-guid | Yes | Entra ID auth configuration | Test token issuance |
| ppadvisor_ClientId | Text | app-reg-dev-guid | app-reg-prod-guid | Yes | Custom connector OAuth | Invoke connector test action |
| ppadvisor_Audience | Text | api://ppadvisor-dev | api://ppadvisor-prod | Yes | Token validation in APIs | Run auth smoke test |
| ppadvisor_SharePointSiteDocs | Text | https://contoso.sharepoint.com/sites/pp-docs-dev | https://contoso.sharepoint.com/sites/pp-docs | Yes | Knowledge indexing source 1 | Run knowledge source sync |
| ppadvisor_SharePointSiteGovernance | Text | https://contoso.sharepoint.com/sites/pp-governance-dev | https://contoso.sharepoint.com/sites/pp-governance | Yes | Knowledge indexing source 2 | Ask governance question in test chat |
| ppadvisor_MSLearnRoot | Text | https://learn.microsoft.com/power-platform/ | https://learn.microsoft.com/power-platform/ | Yes | Public documentation grounding | Validate citation response |
| ppadvisor_CustomConnectorBaseUrl | Text | https://api-dev.contoso.com/pplat | https://api.contoso.com/pplat | Yes | Custom connector runtime | Run connector ping action |
| ppadvisor_CustomConnectorApiKeySecretRef | Text | kv://pp-dev/api-key | kv://pp-prod/api-key | Yes | Connector authentication | Validate secret resolution |
| ppadvisor_ModelDeploymentName | Text | gpt-4.1-mini-dev | gpt-4.1-prod | Yes | Generative response settings | Model test in agent settings |
| ppadvisor_ModelTemperature | Decimal | 0.2 | 0.1 | Yes | Generative tuning | Deterministic response regression test |
| ppadvisor_ModelMaxTokens | Whole Number | 1200 | 1200 | Yes | Response length controls | Long answer test |
| ppadvisor_FallbackTopicName | Text | topic_fallback_dev | topic_fallback_prod | Yes | Unrecognized intent handling | Trigger unknown intent |
| ppadvisor_AnalyticsWorkspaceId | Text | workspace-dev-guid | workspace-prod-guid | Yes | Analytics export and dashboards | Verify event ingestion |
| ppadvisor_AnalyticsReportId | Text | report-dev-guid | report-prod-guid | No | Embedded reporting | Load report from admin app |
| ppadvisor_AppInsightsConnectionString | Text | InstrumentationKey=...dev | InstrumentationKey=...prod | Yes | Observability stream | Confirm telemetry event in AI |
| ppadvisor_AlertWebhookUrl | Text | https://hooks.dev.contoso.net/alerts | https://hooks.prod.contoso.net/alerts | Yes | Ops alert routing | Send test alert action |
| ppadvisor_ServiceNowEndpoint | Text | https://contoso-dev.service-now.com/api | https://contoso.service-now.com/api | No | Incident escalation flow | Run incident creation flow test |
| ppadvisor_TeamsAppId | Text | teams-app-dev-guid | teams-app-prod-guid | Yes | Teams channel publishing | Open app in Teams |
| ppadvisor_WebChatDomainAllowList | Text | https://dev.contoso.com | https://www.contoso.com | Yes | Web chat token issuance | Validate allowed origin check |
| ppadvisor_McpDataverseServer | Text | mcp://dataverse-dev | mcp://dataverse-prod | No | MCP integration routing | Invoke MCP dataverse test |
| ppadvisor_McpFileServer | Text | mcp://file-explorer-dev | mcp://file-explorer-prod | No | File operations use cases | Invoke MCP file listing test |
| ppadvisor_KnowledgeRefreshCron | Text | 0 0 * * 0 | 0 0 * * 0 | Yes | Scheduled sync flows | Check next run time |
| ppadvisor_AllowedRegions | Text | eastus2,westus2 | eastus2 | Yes | Compliance checks | Run region policy check topic |

### 3.3 Component Verification Checklist
1. Managed solution appears in solution list with expected version.
2. All connection references are bound and healthy.
3. All environment variables are set and non-empty for required fields.
4. Cloud flows are turned on and have no connection errors.
5. Custom connector operations render correctly in flow designer.
6. Dataverse tables, columns, and choices are present.
7. Security roles imported and assigned to intended groups.
8. No unmanaged layer contamination in target managed environment.

## 4. Agent Configuration

### 4.1 Import Agent Template

1. Open Copilot Studio in the target environment.
2. Import the Power Platform Advisor template package from source-controlled artifact.
3. Confirm all topics, actions, and knowledge source placeholders are present.
4. Bind environment variables and connection references post-import.

### 4.2 Set System Instructions

Instruction baseline requirements:
- Scope includes canvas apps, Power Automate, Dataverse, connectors, Power Pages, ALM, and CoE guidance.
- Agent must provide production-safe recommendations and avoid speculative operations.
- Agent responses must include commands and verification checkpoints when requested.
- Agent must route unsupported asks to human support or approved escalation topics.
- Agent must apply tenant safety and data handling restrictions in all responses.

### 4.3 Configure Knowledge Sources

| Source | Type | Path or URL | Index Strategy | Refresh Cadence | Validation Question |
|---|---|---|---|---|---|
| Power Platform docs SharePoint library | SharePoint | `https://contoso.sharepoint.com/sites/powerplatform-docs` | Metadata + full text, include PDF and markdown | Weekly | What are managed solution layering best practices? |
| Governance playbook SharePoint library | SharePoint | `https://contoso.sharepoint.com/sites/powerplatform-governance` | Folder scoped by lifecycle and policy domains | Weekly | How are DLP exceptions approved? |
| Microsoft Learn Power Platform root | Web | `https://learn.microsoft.com/power-platform/` | Allowlist to Power Platform and Power Apps domains | Monthly | How do I run Solution Checker with PAC CLI? |
| Dataverse developer docs | Web | `https://learn.microsoft.com/power-apps/developer/data-platform/` | Reference-only technical documentation | Monthly | What is the difference between calculated and rollup columns? |

Knowledge source checkpoints:
- Index completes without authentication or crawl errors.
- Grounded responses include source citations.
- SharePoint permissions do not expose restricted libraries.
- No duplicate content loops or stale index references.
- Negative test confirms blocked site is not indexed.

### 4.4 Add Custom Connectors

```bash
pac connector list
pac connector create --api-def ./connectors/ppadvisor-openapi.json --environment https://org-prod.crm.dynamics.com
pac connector update --connector-id <connector-id> --api-def ./connectors/ppadvisor-openapi.json
```

Connector validation checklist:
1. OAuth 2.0 auth URL and token URL configured correctly.
2. Redirect URI registered in Entra app registration.
3. Required scopes granted and admin consent completed.
4. Test operation returns 200 with expected schema.
5. 429 throttling behavior validated with retry policy.

### 4.5 Configure MCP Servers (If Applicable)

| MCP Server | Purpose | Registration Location | Required Policy | Smoke Test |
|---|---|---|---|---|
| Dataverse MCP | Structured Dataverse read/write tool access | Windows On-Device Agent Registry | Intune + DLP approval | Run table query tool call and verify record count |
| File Explorer MCP | Controlled file operations for assisted workflows | Windows On-Device Agent Registry | Endpoint compliance policy | List directory and open allowed file |
| Internal API MCP | Line-of-business API orchestration | Enterprise MCP registry | Connector + endpoint allowlist | Invoke health endpoint and parse payload |

### 4.6 Configure Generative AI Model and Runtime Settings

| Setting | Recommended Value | Rationale | Verification |
|---|---|---|---|
| Model deployment | `gpt-4.1` or approved enterprise equivalent | Balanced quality and latency | Prompt/response quality benchmark |
| Temperature | 0.1 to 0.2 | Higher determinism for enterprise guidance | Repeatability test across 10 prompts |
| Max tokens | 1000 to 1500 | Control verbosity and cost | Long-form response test |
| Top-p | 0.95 | Maintain response diversity without drift | Regression topic outputs |
| Content safety filters | Enabled strict | Prevent unsafe outputs | Safety prompt test pack |
| Citation requirement | Enabled for grounded topics | Traceability and trust | Cited response validation |

## 5. Topic Deployment

### 5.1 Validate YAML Templates

```bash
npm install --save-dev yaml @stoplight/spectral-cli
npx spectral lint ./tech/agents/power-platform-advisor/topics/**/*.yaml
python ./scripts/validate-topic-triggers.py ./tech/agents/power-platform-advisor/topics
```

Validation gates:
- All topic YAML files parse successfully.
- No duplicate trigger phrases across high-priority topics.
- Fallback topic exists and has safe escalation response.
- All action bindings reference existing connectors/flows.
- No hardcoded secrets or tenant IDs in YAML artifacts.

### 5.2 Import Topics via Code Editor

1. Open Copilot Studio code editor for the target agent.
2. Import validated YAML topic files in dependency order (shared entities first).
3. Resolve schema drift warnings immediately.
4. Save draft and run topic validation before publish.

### 5.3 Verify Trigger Phrase Coverage

| Topic | Minimum Trigger Count | Required Synonyms Included | Coverage Result |
|---|---|---|---|
| `delegation-audit` | 5 | Yes | Pending validation |
| `flow-error-handling` | 5 | Yes | Pending validation |
| `dataverse-modeling` | 5 | Yes | Pending validation |
| `connector-auth` | 5 | Yes | Pending validation |
| `power-pages-security` | 5 | Yes | Pending validation |
| `alm-pipeline` | 5 | Yes | Pending validation |
| `coe-governance` | 5 | Yes | Pending validation |
| `powerbi-embedding` | 5 | Yes | Pending validation |
| `license-advisory` | 5 | Yes | Pending validation |
| `fallback-escalation` | 5 | Yes | Pending validation |

### 5.4 Test Each Topic Individually

| Test ID | Topic | Prompt | Expected Outcome | Status | Evidence |
|---|---|---|---|---|---|
| TOP-001 | `delegation-audit` | Validate canonical prompt for delegation-audit | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-001.png` |
| TOP-002 | `flow-error-handling` | Validate canonical prompt for flow-error-handling | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-002.png` |
| TOP-003 | `dataverse-modeling` | Validate canonical prompt for dataverse-modeling | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-003.png` |
| TOP-004 | `connector-auth` | Validate canonical prompt for connector-auth | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-004.png` |
| TOP-005 | `power-pages-security` | Validate canonical prompt for power-pages-security | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-005.png` |
| TOP-006 | `alm-pipeline` | Validate canonical prompt for alm-pipeline | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-006.png` |
| TOP-007 | `coe-governance` | Validate canonical prompt for coe-governance | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-007.png` |
| TOP-008 | `powerbi-embedding` | Validate canonical prompt for powerbi-embedding | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-008.png` |
| TOP-009 | `license-advisory` | Validate canonical prompt for license-advisory | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-009.png` |
| TOP-010 | `fallback-escalation` | Validate canonical prompt for fallback-escalation | Accurate answer with actionable steps and no policy violation | Pending | `artifacts/tests/TOP-010.png` |

## 6. Authentication Setup

### 6.1 Configure Entra ID Authentication

1. Create or reuse app registration dedicated to Power Platform Advisor agent channels.
2. Add redirect URIs for Copilot Studio and web chat endpoints.
3. Configure delegated scopes for Graph and required APIs.
4. Grant admin consent and record consent timestamp in change log.
5. Store client secret or certificate in approved secret manager.

### 6.2 Configure Channel-Specific Authentication

| Channel | Auth Pattern | Required Setup | Verification |
|---|---|---|---|
| Microsoft Teams | Teams SSO with Entra ID | Configure Teams app manifest and OAuth connection settings | Sign in from Teams client and verify token subject |
| Web chat | Token exchange endpoint + Entra ID | Allowlist domains and configure token issuance flow | Browser sign-in and token refresh test |
| Internal portal | Server-side token relay | Map portal identity to Entra app permissions | End-to-end request with claims trace |

### 6.3 Test Authentication Flow

| Test | Steps | Expected Result |
|---|---|---|
| Valid user SSO | Sign in with authorized user in Teams | Access granted and identity claims present |
| Unauthorized user | Sign in with user outside security group | Access denied with compliant message |
| Expired token | Force token expiration and retry request | Silent refresh or explicit re-auth prompt |
| Revoked consent | Revoke app consent then attempt call | Failure logged and guidance displayed |
| Conditional access policy | Test from compliant and non-compliant device | Access aligned with CA policy |

## 7. Publishing

### 7.1 Publish via CLI or UI

If supported by current PAC capabilities, use scripted publish. Otherwise publish in Copilot Studio UI with audit evidence.

```bash
# Placeholder pattern for scripted deployment wrapper
python ./scripts/publish_agent.py --environment pp-prod --agent power-platform-advisor --release-tag v1.0.0
```

UI publish checkpoints:
- No pending validation errors in topics.
- Knowledge source indexing complete and healthy.
- Authentication status healthy for all enabled channels.
- Release notes include version, changes, and rollback reference.
- Publishing confirmation captured as screenshot.

### 7.2 Enable Teams Channel

1. Enable Teams channel in Copilot Studio channel settings.
2. Bind Teams app ID and verify manifest version.
3. Publish or update app in Teams admin center as required.
4. Validate tenant app permission policies allow access.

### 7.3 Enable Web Chat Channel

1. Configure web chat channel and token endpoint.
2. Apply domain allowlist from environment variable configuration.
3. Embed script in approved site and enforce CSP policy.
4. Validate anonymous versus authenticated behavior requirements.

### 7.4 Verify Publishing Status

| Check | Method | Pass Criteria |
|---|---|---|
| Agent status | Copilot Studio publish panel | Status is Published with current timestamp |
| Teams availability | Teams client search and launch | Agent opens and responds to prompt |
| Web chat availability | Load target web page | Widget loads and starts session successfully |
| Version tracking | Release log artifact | Version matches deployment ticket |

## 8. Post-Deployment Validation

### 8.1 Full Test Matrix

| Matrix ID | Topic | Scenario Type | Prompt | Expected Result | Evidence File |
|---|---|---|---|---|---|
| M-001 | `delegation-audit` | Happy path | Test prompt for delegation-audit (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-001.png` |
| M-002 | `delegation-audit` | Alternate wording | Test prompt for delegation-audit (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-002.png` |
| M-003 | `delegation-audit` | Boundary input | Test prompt for delegation-audit (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-003.png` |
| M-004 | `delegation-audit` | Safety challenge | Test prompt for delegation-audit (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-004.png` |
| M-005 | `delegation-audit` | Fallback trigger | Test prompt for delegation-audit (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-005.png` |
| M-006 | `flow-error-handling` | Happy path | Test prompt for flow-error-handling (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-006.png` |
| M-007 | `flow-error-handling` | Alternate wording | Test prompt for flow-error-handling (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-007.png` |
| M-008 | `flow-error-handling` | Boundary input | Test prompt for flow-error-handling (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-008.png` |
| M-009 | `flow-error-handling` | Safety challenge | Test prompt for flow-error-handling (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-009.png` |
| M-010 | `flow-error-handling` | Fallback trigger | Test prompt for flow-error-handling (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-010.png` |
| M-011 | `dataverse-modeling` | Happy path | Test prompt for dataverse-modeling (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-011.png` |
| M-012 | `dataverse-modeling` | Alternate wording | Test prompt for dataverse-modeling (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-012.png` |
| M-013 | `dataverse-modeling` | Boundary input | Test prompt for dataverse-modeling (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-013.png` |
| M-014 | `dataverse-modeling` | Safety challenge | Test prompt for dataverse-modeling (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-014.png` |
| M-015 | `dataverse-modeling` | Fallback trigger | Test prompt for dataverse-modeling (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-015.png` |
| M-016 | `connector-auth` | Happy path | Test prompt for connector-auth (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-016.png` |
| M-017 | `connector-auth` | Alternate wording | Test prompt for connector-auth (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-017.png` |
| M-018 | `connector-auth` | Boundary input | Test prompt for connector-auth (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-018.png` |
| M-019 | `connector-auth` | Safety challenge | Test prompt for connector-auth (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-019.png` |
| M-020 | `connector-auth` | Fallback trigger | Test prompt for connector-auth (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-020.png` |
| M-021 | `power-pages-security` | Happy path | Test prompt for power-pages-security (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-021.png` |
| M-022 | `power-pages-security` | Alternate wording | Test prompt for power-pages-security (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-022.png` |
| M-023 | `power-pages-security` | Boundary input | Test prompt for power-pages-security (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-023.png` |
| M-024 | `power-pages-security` | Safety challenge | Test prompt for power-pages-security (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-024.png` |
| M-025 | `power-pages-security` | Fallback trigger | Test prompt for power-pages-security (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-025.png` |
| M-026 | `alm-pipeline` | Happy path | Test prompt for alm-pipeline (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-026.png` |
| M-027 | `alm-pipeline` | Alternate wording | Test prompt for alm-pipeline (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-027.png` |
| M-028 | `alm-pipeline` | Boundary input | Test prompt for alm-pipeline (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-028.png` |
| M-029 | `alm-pipeline` | Safety challenge | Test prompt for alm-pipeline (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-029.png` |
| M-030 | `alm-pipeline` | Fallback trigger | Test prompt for alm-pipeline (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-030.png` |
| M-031 | `coe-governance` | Happy path | Test prompt for coe-governance (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-031.png` |
| M-032 | `coe-governance` | Alternate wording | Test prompt for coe-governance (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-032.png` |
| M-033 | `coe-governance` | Boundary input | Test prompt for coe-governance (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-033.png` |
| M-034 | `coe-governance` | Safety challenge | Test prompt for coe-governance (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-034.png` |
| M-035 | `coe-governance` | Fallback trigger | Test prompt for coe-governance (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-035.png` |
| M-036 | `powerbi-embedding` | Happy path | Test prompt for powerbi-embedding (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-036.png` |
| M-037 | `powerbi-embedding` | Alternate wording | Test prompt for powerbi-embedding (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-037.png` |
| M-038 | `powerbi-embedding` | Boundary input | Test prompt for powerbi-embedding (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-038.png` |
| M-039 | `powerbi-embedding` | Safety challenge | Test prompt for powerbi-embedding (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-039.png` |
| M-040 | `powerbi-embedding` | Fallback trigger | Test prompt for powerbi-embedding (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-040.png` |
| M-041 | `license-advisory` | Happy path | Test prompt for license-advisory (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-041.png` |
| M-042 | `license-advisory` | Alternate wording | Test prompt for license-advisory (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-042.png` |
| M-043 | `license-advisory` | Boundary input | Test prompt for license-advisory (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-043.png` |
| M-044 | `license-advisory` | Safety challenge | Test prompt for license-advisory (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-044.png` |
| M-045 | `license-advisory` | Fallback trigger | Test prompt for license-advisory (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-045.png` |
| M-046 | `fallback-escalation` | Happy path | Test prompt for fallback-escalation (Happy path) | Meets expected behavior and policy constraints | `artifacts/matrix/M-046.png` |
| M-047 | `fallback-escalation` | Alternate wording | Test prompt for fallback-escalation (Alternate wording) | Meets expected behavior and policy constraints | `artifacts/matrix/M-047.png` |
| M-048 | `fallback-escalation` | Boundary input | Test prompt for fallback-escalation (Boundary input) | Meets expected behavior and policy constraints | `artifacts/matrix/M-048.png` |
| M-049 | `fallback-escalation` | Safety challenge | Test prompt for fallback-escalation (Safety challenge) | Meets expected behavior and policy constraints | `artifacts/matrix/M-049.png` |
| M-050 | `fallback-escalation` | Fallback trigger | Test prompt for fallback-escalation (Fallback trigger) | Meets expected behavior and policy constraints | `artifacts/matrix/M-050.png` |

### 8.2 Boundary and Safety Tests

| Safety Test | Goal | Expected Handling |
|---|---|---|
| Prompt injection attempt | Ensure instructions are not overridden | Agent refuses unsafe override and stays in policy |
| Sensitive data request | Prevent secret disclosure | Agent declines and provides secure alternative |
| Unsupported destructive action | Avoid unauthorized ops guidance | Agent redirects to approved process |
| Ambiguous governance request | Require clarification before action | Agent asks scoped follow-up question |
| Malformed connector payload | Ensure robust failure handling | Agent reports structured error and next steps |

### 8.3 Performance Baseline

| Metric | Target | Collection Method |
|---|---|---|
| Median response latency | < 3 seconds for grounded Q&A | Channel analytics dashboard |
| P95 response latency | < 7 seconds | Application Insights and channel telemetry |
| Fallback rate baseline | < 12% initial target | Topic analytics report |
| Containment rate baseline | > 60% initial target | Conversation outcome analytics |
| Auth success rate | > 98% | Identity event logs and channel telemetry |

### 8.4 Screenshots and Evidence Capture

Use `copilotbrowser-cli` for reproducible evidence collection:

```bash
copilotbrowser run --file ./tests/evidence/publish-status.js
copilotbrowser run --file ./tests/evidence/teams-smoke.js
copilotbrowser run --file ./tests/evidence/webchat-smoke.js
copilotbrowser screenshot --url https://copilotstudio.microsoft.com --output ./artifacts/screens/publish-panel.png
```

Suggested copilotbrowser pattern (JavaScript):

```javascript
module.exports = async ({ page }) => {
  await page.goto('https://copilotstudio.microsoft.com');
  await page.waitForSelector('text=Published');
  await page.screenshot({ path: './artifacts/screens/publish-status.png', fullPage: true });
};
```

## 9. Monitoring Plan

### 9.1 Analytics Dashboard Setup

1. Enable conversation transcripts and analytics export in Copilot Studio settings.
2. Route telemetry to Dataverse analytics table and/or Application Insights workspace.
3. Create Power BI dashboard with operational and quality views.
4. Restrict dashboard access to support, product owner, and platform admins.

### 9.2 Key Metrics to Track

| Metric | Definition | Target | Review Cadence |
|---|---|---|---|
| Containment rate | Percent of sessions resolved without human handoff | >= 70% after tuning period | Weekly |
| CSAT | Average satisfaction score for completed interactions | >= 4.2/5 | Weekly |
| Topic coverage | Percent of intents mapped to high-confidence topics | >= 85% | Weekly |
| Fallback rate | Percent of conversations routed to fallback topic | <= 10% | Weekly |
| Grounded citation rate | Percent of knowledge responses with valid citations | >= 95% | Monthly |
| Auth failure rate | Percent of sessions failing sign-in | <= 2% | Daily |
| Latency P95 | 95th percentile response time | <= 7s | Daily |

### 9.3 Alerting Thresholds

| Alert | Condition | Severity | Action |
|---|---|---|---|
| High fallback spike | Fallback rate > 20% for 30 min | High | Initiate incident triage and disable problematic topic |
| Auth outage | Auth failures > 10% for 15 min | High | Engage identity team and switch to maintenance notice |
| Latency degradation | P95 latency > 12s for 20 min | Medium | Scale dependent services and inspect connector timeouts |
| Knowledge source failure | Index refresh failure for scheduled run | Medium | Retry crawl and notify knowledge owners |
| Safety violation | Any confirmed unsafe output incident | High | Immediate disable publish and invoke response protocol |

## 10. Rollback Procedure

### 10.1 Solution Rollback via PAC CLI

Rollback strategy depends on deployment method:

- Managed upgrade rollback: re-import previous known-good managed solution package.
- Emergency disable: unpublish agent channels and disable impacted topics/actions.

```bash
pac auth select --name pp-prod
pac solution import --path ./solutions/PowerPlatformAdvisor_managed_prev.zip --publish-changes --async
pac solution list
```

### 10.2 Environment Restore from Backup

1. Confirm restore point timestamp before deployment window.
2. Initiate environment restore in Power Platform Admin Center.
3. Track restore completion and validate solution state after restore.
4. Re-run authentication and channel health checks.

### 10.3 Communication Plan

| Audience | Trigger | Communication Channel | Owner | SLA |
|---|---|---|---|---|
| Business stakeholders | Rollback initiated | Email + Teams incident channel | Product owner | Within 15 minutes |
| Support desk | Customer impact confirmed | Service desk incident update | Support lead | Within 10 minutes |
| Engineering team | Technical mitigation required | Incident bridge and Teams call | Release manager | Immediate |
| Security/compliance | Potential policy or data event | Security incident workflow | Security lead | Within 30 minutes |

## 11. Maintenance Schedule

### 11.1 Weekly Activities
1. Review unrecognized inputs and map high-frequency intents to new or improved topics.
2. Review fallback transcripts for guidance quality and escalation correctness.
3. Check auth failure logs and remediate recurring identity issues.
4. Validate connector health and API throttling trends.
5. Confirm active alerts and close false positives with tuning updates.

### 11.2 Monthly Activities
1. Refresh knowledge sources and validate index coverage for newly published docs.
2. Review analytics trends for containment, CSAT, and fallback performance.
3. Run topic trigger phrase optimization based on transcript mining.
4. Validate environment variable values and secret rotation status.
5. Review DLP policy exceptions and remove expired approvals.

### 11.3 Quarterly Activities
1. Execute full regression evaluation across all topics and channels.
2. Conduct license utilization and capacity review; adjust allocations.
3. Perform disaster recovery rehearsal including rollback and restore drill.
4. Review security posture, conditional access policies, and service principal permissions.
5. Update runbook, architecture diagrams, and operational ownership matrix.

## 12. Verification Checkpoints by Phase

| Phase | Checkpoint | Evidence Artifact | Approver |
|---|---|---|---|
| Prerequisites | Tools and permissions validated | `artifacts/preflight/checklist.md` | Release manager |
| Provisioning | Environment, DLP, security groups configured | `artifacts/provisioning/report.md` | Platform admin |
| Solution import | Managed solution imported and healthy | `artifacts/import/import-log.txt` | Solution owner |
| Agent config | Instructions, knowledge, connectors configured | `artifacts/config/config-screens.png` | Agent owner |
| Topics | YAML validated and topic tests passed | `artifacts/topics/test-results.csv` | QA lead |
| Authentication | SSO and channel auth tests pass | `artifacts/auth/auth-tests.md` | Identity lead |
| Publishing | Channels enabled and published | `artifacts/publish/publish-proof.png` | Release manager |
| Post validation | Matrix and safety tests complete | `artifacts/validation/matrix-summary.md` | QA lead |
| Monitoring | Dashboard and alerts active | `artifacts/monitoring/dashboard-link.txt` | Ops lead |

## 13. copilotbrowser-cli Execution Patterns

Use these patterns to automate repeatable validation tasks.

```bash
# Run a scripted smoke test suite
copilotbrowser run --file ./tests/smoke/all-channels.js --headless

# Capture screenshot evidence for a page
copilotbrowser screenshot --url https://copilotstudio.microsoft.com/environments/<envId>/agents/<agentId> --output ./artifacts/screens/agent-home.png

# Execute a JSON scenario if your CLI supports scenario playback
copilotbrowser run --scenario ./tests/scenarios/topic-delegation-audit.json
```

Recommended script assertions:
- Published badge is visible after release.
- Each enabled channel returns at least one successful response.
- Auth prompt appears for protected topics and resolves correctly.
- Fallback topic returns compliant escalation response.
- Error banner absence on agent settings and channel pages.

## 14. ALM Pipeline Reference

### 14.1 Azure DevOps Pipeline Task Order
1. `PowerPlatformToolInstaller@2`
2. `PowerPlatformWhoAmI@2`
3. `PowerPlatformImportSolution@2`
4. `PowerPlatformApplySolutionUpgrade@2 (if upgrade scenario)`
5. `PowerPlatformPublishCustomizations@2`
6. `PowerPlatformRunSolutionChecker@2`
7. `Custom script: validate topic YAML`
8. `Custom script: publish agent configuration`
9. `Custom script: post-deployment smoke tests`

### 14.2 PAC Command Bundle for CI/CD

```bash
pac auth create --applicationId $APP_ID --clientSecret $CLIENT_SECRET --tenant $TENANT_ID --url $ENV_URL --name ci-auth
pac auth select --name ci-auth
pac solution import --path $(Build.ArtifactStagingDirectory)/PowerPlatformAdvisor_managed.zip --publish-changes --async
pac solution check --path $(Build.ArtifactStagingDirectory)/PowerPlatformAdvisor_managed.zip --outputDirectory $(Build.ArtifactStagingDirectory)/checker
```

## 15. Operational Readiness Sign-Off

| Workstream | Owner | Status | Sign-off Date | Notes |
|---|---|---|---|---|
| Licensing | TBD | Pending | TBD | |
| Security and access | TBD | Pending | TBD | |
| Environment provisioning | TBD | Pending | TBD | |
| Solution import | TBD | Pending | TBD | |
| Agent configuration | TBD | Pending | TBD | |
| Topic QA | TBD | Pending | TBD | |
| Authentication | TBD | Pending | TBD | |
| Publishing | TBD | Pending | TBD | |
| Monitoring | TBD | Pending | TBD | |
| Rollback readiness | TBD | Pending | TBD | |

## 16. Appendix A - Troubleshooting Quick Reference

| Symptom | Probable Cause | Immediate Action | Escalation Path |
|---|---|---|---|
| Solution import stuck in async | Dependency issue or large upgrade process | Check import job details, retry with longer wait | Platform engineering |
| Connector auth fails with invalid_client | Incorrect client secret or redirect URI mismatch | Rotate secret and validate app registration settings | Identity team |
| High fallback rate after publish | Missing triggers or topic ranking drift | Review transcripts and add trigger variants | Conversation design lead |
| Teams channel unavailable | Manifest or admin policy mismatch | Republish Teams app and verify policies | Teams admin |
| Knowledge response missing citations | Index lag or source configuration issue | Re-index sources and validate grounding settings | Knowledge owner |

## 17. Appendix B - Change Log Template

| Date | Version | Change Summary | Author | Approval |
|---|---|---|---|---|
| YYYY-MM-DD | vX.Y.Z | Describe deployment or runbook update | Name | Approver |

## 18. Exit Criteria

1. All prerequisite checks are complete and documented.
2. Environment controls (DLP, groups, region, capacity) are compliant.
3. Solution import completed with no blocking errors.
4. Agent configuration, knowledge, connectors, and optional MCP settings validated.
5. All topics pass at least one dedicated test and matrix execution.
6. Authentication verified across required channels.
7. Publishing confirmed for Teams and web chat targets.
8. Post-deployment tests, baseline metrics, and evidence artifacts captured.
9. Monitoring alerts configured and tested.
10. Rollback package and restore point confirmed.

## 19. Extended Verification Catalog

| ID | Area | Verification Step | Expected Result |
|---|---|---|---|
| EV-001 | Prereq | Execute Prereq checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-002 | Prereq | Execute Prereq checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-003 | Prereq | Execute Prereq checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-004 | Prereq | Execute Prereq checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-005 | Prereq | Execute Prereq checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-006 | Prereq | Execute Prereq checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-007 | Prereq | Execute Prereq checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-008 | Prereq | Execute Prereq checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-009 | Prereq | Execute Prereq checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-010 | Prereq | Execute Prereq checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-011 | Prereq | Execute Prereq checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-012 | Prereq | Execute Prereq checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-013 | Prereq | Execute Prereq checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-014 | Prereq | Execute Prereq checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-015 | Prereq | Execute Prereq checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-016 | Prereq | Execute Prereq checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-017 | Prereq | Execute Prereq checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-018 | Prereq | Execute Prereq checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-019 | Prereq | Execute Prereq checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-020 | Prereq | Execute Prereq checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-021 | Prereq | Execute Prereq checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-022 | Prereq | Execute Prereq checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-023 | Prereq | Execute Prereq checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-024 | Prereq | Execute Prereq checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-025 | Prereq | Execute Prereq checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-026 | Provisioning | Execute Provisioning checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-027 | Provisioning | Execute Provisioning checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-028 | Provisioning | Execute Provisioning checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-029 | Provisioning | Execute Provisioning checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-030 | Provisioning | Execute Provisioning checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-031 | Provisioning | Execute Provisioning checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-032 | Provisioning | Execute Provisioning checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-033 | Provisioning | Execute Provisioning checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-034 | Provisioning | Execute Provisioning checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-035 | Provisioning | Execute Provisioning checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-036 | Provisioning | Execute Provisioning checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-037 | Provisioning | Execute Provisioning checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-038 | Provisioning | Execute Provisioning checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-039 | Provisioning | Execute Provisioning checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-040 | Provisioning | Execute Provisioning checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-041 | Provisioning | Execute Provisioning checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-042 | Provisioning | Execute Provisioning checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-043 | Provisioning | Execute Provisioning checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-044 | Provisioning | Execute Provisioning checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-045 | Provisioning | Execute Provisioning checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-046 | Provisioning | Execute Provisioning checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-047 | Provisioning | Execute Provisioning checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-048 | Provisioning | Execute Provisioning checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-049 | Provisioning | Execute Provisioning checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-050 | Provisioning | Execute Provisioning checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-051 | Import | Execute Import checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-052 | Import | Execute Import checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-053 | Import | Execute Import checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-054 | Import | Execute Import checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-055 | Import | Execute Import checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-056 | Import | Execute Import checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-057 | Import | Execute Import checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-058 | Import | Execute Import checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-059 | Import | Execute Import checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-060 | Import | Execute Import checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-061 | Import | Execute Import checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-062 | Import | Execute Import checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-063 | Import | Execute Import checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-064 | Import | Execute Import checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-065 | Import | Execute Import checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-066 | Import | Execute Import checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-067 | Import | Execute Import checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-068 | Import | Execute Import checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-069 | Import | Execute Import checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-070 | Import | Execute Import checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-071 | Import | Execute Import checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-072 | Import | Execute Import checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-073 | Import | Execute Import checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-074 | Import | Execute Import checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-075 | Import | Execute Import checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-076 | Config | Execute Config checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-077 | Config | Execute Config checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-078 | Config | Execute Config checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-079 | Config | Execute Config checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-080 | Config | Execute Config checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-081 | Config | Execute Config checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-082 | Config | Execute Config checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-083 | Config | Execute Config checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-084 | Config | Execute Config checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-085 | Config | Execute Config checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-086 | Config | Execute Config checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-087 | Config | Execute Config checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-088 | Config | Execute Config checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-089 | Config | Execute Config checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-090 | Config | Execute Config checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-091 | Config | Execute Config checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-092 | Config | Execute Config checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-093 | Config | Execute Config checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-094 | Config | Execute Config checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-095 | Config | Execute Config checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-096 | Config | Execute Config checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-097 | Config | Execute Config checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-098 | Config | Execute Config checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-099 | Config | Execute Config checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-100 | Config | Execute Config checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-101 | Topics | Execute Topics checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-102 | Topics | Execute Topics checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-103 | Topics | Execute Topics checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-104 | Topics | Execute Topics checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-105 | Topics | Execute Topics checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-106 | Topics | Execute Topics checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-107 | Topics | Execute Topics checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-108 | Topics | Execute Topics checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-109 | Topics | Execute Topics checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-110 | Topics | Execute Topics checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-111 | Topics | Execute Topics checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-112 | Topics | Execute Topics checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-113 | Topics | Execute Topics checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-114 | Topics | Execute Topics checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-115 | Topics | Execute Topics checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-116 | Topics | Execute Topics checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-117 | Topics | Execute Topics checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-118 | Topics | Execute Topics checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-119 | Topics | Execute Topics checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-120 | Topics | Execute Topics checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-121 | Topics | Execute Topics checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-122 | Topics | Execute Topics checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-123 | Topics | Execute Topics checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-124 | Topics | Execute Topics checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-125 | Topics | Execute Topics checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-126 | Auth | Execute Auth checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-127 | Auth | Execute Auth checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-128 | Auth | Execute Auth checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-129 | Auth | Execute Auth checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-130 | Auth | Execute Auth checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-131 | Auth | Execute Auth checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-132 | Auth | Execute Auth checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-133 | Auth | Execute Auth checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-134 | Auth | Execute Auth checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-135 | Auth | Execute Auth checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-136 | Auth | Execute Auth checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-137 | Auth | Execute Auth checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-138 | Auth | Execute Auth checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-139 | Auth | Execute Auth checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-140 | Auth | Execute Auth checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-141 | Auth | Execute Auth checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-142 | Auth | Execute Auth checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-143 | Auth | Execute Auth checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-144 | Auth | Execute Auth checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-145 | Auth | Execute Auth checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-146 | Auth | Execute Auth checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-147 | Auth | Execute Auth checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-148 | Auth | Execute Auth checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-149 | Auth | Execute Auth checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-150 | Auth | Execute Auth checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-151 | Publish | Execute Publish checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-152 | Publish | Execute Publish checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-153 | Publish | Execute Publish checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-154 | Publish | Execute Publish checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-155 | Publish | Execute Publish checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-156 | Publish | Execute Publish checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-157 | Publish | Execute Publish checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-158 | Publish | Execute Publish checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-159 | Publish | Execute Publish checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-160 | Publish | Execute Publish checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-161 | Publish | Execute Publish checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-162 | Publish | Execute Publish checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-163 | Publish | Execute Publish checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-164 | Publish | Execute Publish checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-165 | Publish | Execute Publish checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-166 | Publish | Execute Publish checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-167 | Publish | Execute Publish checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-168 | Publish | Execute Publish checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-169 | Publish | Execute Publish checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-170 | Publish | Execute Publish checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-171 | Publish | Execute Publish checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-172 | Publish | Execute Publish checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-173 | Publish | Execute Publish checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-174 | Publish | Execute Publish checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-175 | Publish | Execute Publish checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-176 | Validation | Execute Validation checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-177 | Validation | Execute Validation checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-178 | Validation | Execute Validation checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-179 | Validation | Execute Validation checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-180 | Validation | Execute Validation checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-181 | Validation | Execute Validation checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-182 | Validation | Execute Validation checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-183 | Validation | Execute Validation checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-184 | Validation | Execute Validation checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-185 | Validation | Execute Validation checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-186 | Validation | Execute Validation checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-187 | Validation | Execute Validation checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-188 | Validation | Execute Validation checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-189 | Validation | Execute Validation checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-190 | Validation | Execute Validation checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-191 | Validation | Execute Validation checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-192 | Validation | Execute Validation checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-193 | Validation | Execute Validation checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-194 | Validation | Execute Validation checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-195 | Validation | Execute Validation checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-196 | Validation | Execute Validation checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-197 | Validation | Execute Validation checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-198 | Validation | Execute Validation checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-199 | Validation | Execute Validation checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-200 | Validation | Execute Validation checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-201 | Monitoring | Execute Monitoring checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-202 | Monitoring | Execute Monitoring checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-203 | Monitoring | Execute Monitoring checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-204 | Monitoring | Execute Monitoring checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-205 | Monitoring | Execute Monitoring checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-206 | Monitoring | Execute Monitoring checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-207 | Monitoring | Execute Monitoring checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-208 | Monitoring | Execute Monitoring checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-209 | Monitoring | Execute Monitoring checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-210 | Monitoring | Execute Monitoring checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-211 | Monitoring | Execute Monitoring checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-212 | Monitoring | Execute Monitoring checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-213 | Monitoring | Execute Monitoring checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-214 | Monitoring | Execute Monitoring checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-215 | Monitoring | Execute Monitoring checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-216 | Monitoring | Execute Monitoring checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-217 | Monitoring | Execute Monitoring checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-218 | Monitoring | Execute Monitoring checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-219 | Monitoring | Execute Monitoring checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-220 | Monitoring | Execute Monitoring checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-221 | Monitoring | Execute Monitoring checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-222 | Monitoring | Execute Monitoring checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-223 | Monitoring | Execute Monitoring checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-224 | Monitoring | Execute Monitoring checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-225 | Monitoring | Execute Monitoring checkpoint 25 and capture evidence | Pass with no blocking defects |
| EV-226 | Rollback | Execute Rollback checkpoint 1 and capture evidence | Pass with no blocking defects |
| EV-227 | Rollback | Execute Rollback checkpoint 2 and capture evidence | Pass with no blocking defects |
| EV-228 | Rollback | Execute Rollback checkpoint 3 and capture evidence | Pass with no blocking defects |
| EV-229 | Rollback | Execute Rollback checkpoint 4 and capture evidence | Pass with no blocking defects |
| EV-230 | Rollback | Execute Rollback checkpoint 5 and capture evidence | Pass with no blocking defects |
| EV-231 | Rollback | Execute Rollback checkpoint 6 and capture evidence | Pass with no blocking defects |
| EV-232 | Rollback | Execute Rollback checkpoint 7 and capture evidence | Pass with no blocking defects |
| EV-233 | Rollback | Execute Rollback checkpoint 8 and capture evidence | Pass with no blocking defects |
| EV-234 | Rollback | Execute Rollback checkpoint 9 and capture evidence | Pass with no blocking defects |
| EV-235 | Rollback | Execute Rollback checkpoint 10 and capture evidence | Pass with no blocking defects |
| EV-236 | Rollback | Execute Rollback checkpoint 11 and capture evidence | Pass with no blocking defects |
| EV-237 | Rollback | Execute Rollback checkpoint 12 and capture evidence | Pass with no blocking defects |
| EV-238 | Rollback | Execute Rollback checkpoint 13 and capture evidence | Pass with no blocking defects |
| EV-239 | Rollback | Execute Rollback checkpoint 14 and capture evidence | Pass with no blocking defects |
| EV-240 | Rollback | Execute Rollback checkpoint 15 and capture evidence | Pass with no blocking defects |
| EV-241 | Rollback | Execute Rollback checkpoint 16 and capture evidence | Pass with no blocking defects |
| EV-242 | Rollback | Execute Rollback checkpoint 17 and capture evidence | Pass with no blocking defects |
| EV-243 | Rollback | Execute Rollback checkpoint 18 and capture evidence | Pass with no blocking defects |
| EV-244 | Rollback | Execute Rollback checkpoint 19 and capture evidence | Pass with no blocking defects |
| EV-245 | Rollback | Execute Rollback checkpoint 20 and capture evidence | Pass with no blocking defects |
| EV-246 | Rollback | Execute Rollback checkpoint 21 and capture evidence | Pass with no blocking defects |
| EV-247 | Rollback | Execute Rollback checkpoint 22 and capture evidence | Pass with no blocking defects |
| EV-248 | Rollback | Execute Rollback checkpoint 23 and capture evidence | Pass with no blocking defects |
| EV-249 | Rollback | Execute Rollback checkpoint 24 and capture evidence | Pass with no blocking defects |
| EV-250 | Rollback | Execute Rollback checkpoint 25 and capture evidence | Pass with no blocking defects |
