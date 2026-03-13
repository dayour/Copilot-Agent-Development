# Copilot Agent Development

> A production-ready library of **18 Copilot Studio agents** across **5 industry verticals**, with deployment runbooks, conversation templates, solution definitions, evaluation frameworks, and browser-automation tooling — all importable into Microsoft Power Platform / Copilot Studio.

[![Monowiki](https://img.shields.io/badge/📖_Monowiki-Browse_All_Docs-blue)](#-monowiki) [![Agents](https://img.shields.io/badge/🤖_Agents-18_Total-green)](#-agent-inventory) [![Verticals](https://img.shields.io/badge/🏢_Verticals-5-purple)](#-repository-structure)

---

## 📖 Monowiki

All repository documentation is compiled into a **single-file searchable wiki**:

👉 **[`docs/index.html`](./docs/index.html)** — 152 documents, 13 sections, full-text search, collapsible articles, dark theme

Open it locally or serve via GitHub Pages (`layout: null` Jekyll front matter included).

---

## 🏢 Repository Structure

| Folder | Vertical | Agents |
|--------|----------|--------|
| [coffee/](./coffee/) | ☕ Coffee | [Virtual Coach](./coffee/agents/virtual-coach/) |
| [clothing/](./clothing/) | 👔 Clothing | [Power Analysis](./clothing/agents/power-analysis/) |
| [insurance/](./insurance/) | 🛡️ Insurance | [Claims Assistant](./insurance/agents/claims-assistant/) |
| [tech/](./tech/) | 💻 Tech | 11 agents — see [inventory](#-agent-inventory) |
| [transportation/](./transportation/) | 🚛 Transportation | [Fleet Coordinator](./transportation/agents/fleet-coordinator/), [Fuel Tracking](./transportation/agents/fuel-tracking/), [Route Optimizer](./transportation/agents/route-optimizer/) |

### Supporting Directories

| Folder | Purpose |
|--------|---------|
| [docs/](./docs/) | Cross-cutting guides: architecture, auth, connectors, governance, analytics, A365 SDK, Playwright/MCP |
| [runbook/](./runbook/) | Operational runbooks: scheduling apps, meeting assist, troubleshooting, Teams Premium |
| [runbook_steps/](./runbook_steps/) | Step-by-step Copilot Studio procedures (agent creation → authentication verification) |
| [Power MCP UI Topic Builder/](./Power%20MCP%20UI%20Topic%20Builder/) | Browser-automation commands and selectors for Copilot Studio UI |
| [CopilotStudio-Agent-Suite/](./CopilotStudio-Agent-Suite/) | Importable agent packages, deployment guides, and project completion reports |
| [MADcool/](./MADcool/) | MAD Cool Scheduler integration artifacts |
| [tools/](./tools/) | Utilities: Caddy analytics, connector health checks, transcript analysis |
| [evals/](./evals/) | Agent evaluation framework: test sets per vertical, graders, reporting |

---

## 🤖 Agent Inventory

### ☕ Coffee
| Agent | Description |
|-------|-------------|
| [Virtual Coach](./coffee/agents/virtual-coach/) | Barista training, brew guides, and quality coaching |

### 👔 Clothing
| Agent | Description |
|-------|-------------|
| [Power Analysis](./clothing/agents/power-analysis/) | BI agent for sales, inventory, and trend analytics via Power BI |

### 🛡️ Insurance
| Agent | Description |
|-------|-------------|
| [Claims Assistant](./insurance/agents/claims-assistant/) | Claims intake, status tracking, and policyholder support |

### 💻 Tech (11 agents)
| Agent | Description |
|-------|-------------|
| [IT Help Desk](./tech/agents/it-help-desk/) | Tier-1 IT support, ticket routing, and self-service resolution |
| [Support Bot](./tech/agents/support-bot/) | Generative AI support with connected agents and skills |
| [Policy Advisor](./tech/agents/policy-advisor/) | Governance policy lookup and compliance guidance |
| [Power Platform Advisor](./tech/agents/power-platform-advisor/) | Dataverse, connectors, ALM, and Power Fx guidance |
| [Seller Prospect](./tech/agents/seller-prospect/) | Sales prospecting and lead qualification |
| [Knowledge Base](./tech/agents/knowledge-base/) | Knowledge retrieval and search agent |
| [A365 Orchestrator](./tech/agents/a365-orchestrator/) | Microsoft 365 Agents SDK orchestration |
| [MAD Scheduler](./tech/agents/mad-scheduler/) | Meeting and scheduling automation |
| [Entra Security Ops](./tech/agents/entra-security-ops/) | Entra ID security operations and monitoring |
| [Kusto Analytics](./tech/agents/kusto-analytics/) | KQL-powered analytics and data exploration |
| darbot-mcp-builder | MCP tool builder (in development) |

### 🚛 Transportation (3 agents)
| Agent | Description |
|-------|-------------|
| [Fleet Coordinator](./transportation/agents/fleet-coordinator/) | Fleet management, driver assignment, and dispatch |
| [Fuel Tracking](./transportation/agents/fuel-tracking/) | Fuel consumption monitoring and cost optimization |
| [Route Optimizer](./transportation/agents/route-optimizer/) | Route planning, ETA calculation, HOS compliance, and rerouting |

---

## 🏗️ Agent Scaffold

Every fully-documented agent follows the same four-file scaffold:

```
<vertical>/agents/<agent-name>/
├── README.md                    ← agent overview, topics, and quick-start guide
├── runbook.md                   ← prerequisites, deployment steps, monitoring, rollback
├── templates/
│   └── agent-template.yaml      ← Copilot Studio topic & conversation template
└── solution/
    └── solution-definition.yaml ← Power Platform solution definition (import-ready)
```

---

## 🚀 Getting Started

1. Browse to the vertical folder that matches your industry.
2. Open the agent folder and read the `README.md` for an overview.
3. Follow the `runbook.md` to set up your Copilot Studio environment.
4. Import `solution/solution-definition.yaml` and map the environment variables to your tenant.
5. Customise `templates/agent-template.yaml` with your organisation's content.
6. Publish the agent to Microsoft Teams or your preferred channel.

> **New here?** Start with the [runbook steps](./runbook_steps/) for a guided walkthrough from agent creation through authentication verification.

---

## 📚 Documentation

### Core Guides

| Guide | Description |
|-------|-------------|
| [Architecture](./docs/architecture.md) | Mermaid diagrams for conversation flows, data pipelines, and integrations |
| [Authentication](./docs/authentication.md) | Azure AD, B2C, Salesforce SSO, service accounts, RLS pass-through |
| [Connectors](./docs/connectors.md) | All connector types, setup, auth patterns, rate limits, error handling |
| [Extensibility](./docs/extensibility.md) | Adding topics, custom connectors, knowledge sources, new verticals |
| [Publishing](./docs/publishing.md) | Channel deployment: Teams, web chat, mobile, Power Apps, B2C |
| [Admin & Governance](./docs/admin-governance.md) | Licensing, DLP, analytics, GDPR, security hardening, audit logging |
| [Agent Lifecycle](./docs/agent-lifecycle.md) | Dev → test → staging → production → monitoring → retirement |
| [Agent Configuration](./docs/agent-config-guide.md) | End-to-end Copilot Studio creation: architecture, instructions, knowledge, ALM |
| [Swarm Architecture](./docs/swarm-architecture.md) | Multi-agent orchestration and swarm patterns |
| [Transcript Analysis](./docs/transcript-analysis.md) | Conversation transcript analysis and insights |

### Microsoft 365 Agents SDK (A365)

| Guide | Description |
|-------|-------------|
| [SDK Architecture](./docs/a365/sdk-architecture.md) | M365 Agents SDK structure and design |
| [Integration Patterns](./docs/a365/integration-patterns.md) | Cross-platform agent integration approaches |
| [Authentication Guide](./docs/a365/authentication-guide.md) | A365-specific auth flows and configuration |
| [A2A Quickstart](./docs/a2a-quickstart.md) | Agent-to-agent communication quickstart |

### Browser Automation (Copilot Studio UI)

| Guide | Description |
|-------|-------------|
| [Playwright/MCP README](./docs/copilotbrowser/README.md) | Browser automation for Copilot Studio overview |
| [Selector Reference](./docs/copilotbrowser/selector-reference.md) | CSS/Playwright selectors for Copilot Studio UI elements |
| [Best Practices](./docs/copilotbrowser/best-practices.md) | Automation reliability, wait strategies, error recovery |
| [MCP-to-CLI Migration](./docs/copilotbrowser/mcp-to-cli-migration.md) | Migrating from MCP tools to CLI-based automation |

### Caddy Reverse Proxy

| Guide | Description |
|-------|-------------|
| [Architecture](./docs/caddy/architecture.md) | Caddy deployment architecture |
| [Deployment Guide](./docs/caddy/deployment-guide.md) | Step-by-step Caddy setup |
| [Security Hardening](./docs/caddy/security-hardening.md) | TLS, headers, rate limiting |

### Analytics & Monitoring

| Guide | Description |
|-------|-------------|
| [KPI Framework](./docs/analytics/kpi-framework.md) | Agent performance metrics and dashboards |
| [Alerting Configuration](./docs/analytics/alerting-config.md) | Alert rules, thresholds, and notification channels |
| [Connector Health Monitoring](./docs/connectors/health-monitoring.md) | Connector uptime tracking and diagnostics |

### CoE Strategy

Governance and strategy documents for managing the agent fleet at scale:

| Guide | Description |
|-------|-------------|
| [CoE Governance Patterns](./docs/strategy/coe-governance.md) | Center of Excellence governance framework |
| [Agent Registry Template](./docs/strategy/agent-registry-template.md) | Central registry schema, PAC CLI refresh, orphan classification |
| [SLA Definitions](./docs/strategy/sla-definitions.md) | Agent tiers (P0/P1/P2), availability targets, incident response |
| [Security & Compliance](./docs/strategy/security-compliance-checklist.md) | Pre-production security controls and data residency |
| [Environment Topology](./docs/strategy/environment-topology.md) | Dev/test/staging/prod environment layout |
| [Environment Variables](./docs/strategy/environment-variable-matrix.md) | Cross-environment variable configuration matrix |
| [DLP Policy Templates](./docs/strategy/dlp-policy-templates.md) | Data loss prevention policy templates |
| [Promotion Pipeline](./docs/strategy/promotion-pipeline.md) | Solution promotion across environments |

### Templates

| Template | Description |
|----------|-------------|
| [Lifecycle Checklist](./docs/templates/lifecycle-checklist.md) | Agent lifecycle management checklist |
| [Requirements Template](./docs/templates/requirements-template.md) | Agent requirements gathering template |
| [Retirement Plan](./docs/templates/retirement-plan.md) | Agent decommissioning plan template |

---

## 🧪 Evaluation Framework

The [`evals/`](./evals/) directory contains a cross-vertical agent evaluation framework:

- **Test sets** per vertical and agent (`evals/<vertical>/`)
- **Graders** for conversation quality, topic coverage, and grounding assessment
- **Reporting** for regression tracking and quality gates

---

## ⚡ Power MCP UI Topic Builder

The [`Power MCP UI Topic Builder/`](./Power%20MCP%20UI%20Topic%20Builder/) provides browser-automation tooling for Copilot Studio:

| File | Purpose |
|------|---------|
| [PowerAgentBuilder.md](./Power%20MCP%20UI%20Topic%20Builder/PowerAgentBuilder.md) | Full agent build automation via MCP |
| [CopilotStudioUI.md](./Power%20MCP%20UI%20Topic%20Builder/CopilotStudioUI.md) | UI element and selector reference |
| [powermcpcommands.md](./Power%20MCP%20UI%20Topic%20Builder/powermcpcommands.md) | MCP command reference |
| [PowerTask.md](./Power%20MCP%20UI%20Topic%20Builder/PowerTask.md) | Task-oriented selector guide |

---

## 🔧 Tools

| Tool | Description |
|------|-------------|
| [Caddy Analytics](./tools/caddy-analytics/) | Analytics dashboard for Caddy reverse proxy |
| [Connector Health Check](./tools/connector-health-check.py) | Python script for connector uptime monitoring |
| [Transcript Analysis](./tools/transcript-analysis.py) | Conversation transcript analysis pipeline |
| [Local Dev](./tools/local-dev/) | Local development environment setup |

---

## 📝 Runbook Steps

Step-by-step Copilot Studio procedures in [`runbook_steps/`](./runbook_steps/):

| Step | Guide |
|------|-------|
| 01 | [Agent Creation](./runbook_steps/01-agent-creation.md) |
| 02 | [Model Selection](./runbook_steps/02-model-selection.md) |
| 03 | [Instructions Authoring](./runbook_steps/03-instructions-authoring.md) |
| 04 | [Knowledge Source Management](./runbook_steps/04-knowledge-source-management.md) |
| 05 | [Tool & Action Management](./runbook_steps/05-tool-and-action-management.md) |
| 06 | [Topic Creation (YAML)](./runbook_steps/06-topic-creation-yaml.md) |
| 07 | [Trigger Phrase Updates](./runbook_steps/07-topic-trigger-phrase-updates.md) |
| 08 | [Topic Testing](./runbook_steps/08-topic-testing.md) |
| 09 | [Publish Agent](./runbook_steps/09-publish-agent.md) |
| 10 | [Enable Teams Channel](./runbook_steps/10-enable-teams-channel.md) |
| 11 | [Enable Web Chat](./runbook_steps/11-enable-web-chat.md) |
| 12 | [Environment Switching](./runbook_steps/12-environment-switching.md) |
| 13 | [Authentication Verification](./runbook_steps/13-authentication-verification.md) |

