# Runbook — A365 Orchestrator (Tech)

## Overview

This runbook covers end-to-end provisioning, deployment, configuration, and operations for the A365 Orchestrator — a Teams AI agent built with the M365 Agents SDK that routes user requests to specialist Copilot Studio agents (IT Help Desk, Calendar Manager, Knowledge Base).

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Azure subscription | Contributor rights on the target resource group |
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Node.js 20+ | LTS release |
| M365 Agents Toolkit CLI | `npm install -g @microsoft/teamsapp-cli` |
| Azure CLI | Authenticated: `az login` |
| Entra ID permissions | Application.ReadWrite.All (to create app registrations) |

### Specialist agents that must be deployed first

| Agent | Location | Required Environment Variable |
|-------|----------|-------------------------------|
| IT Help Desk | `tech/agents/it-help-desk/` | `IT_HELP_DESK_ENVIRONMENT_ID`, `IT_HELP_DESK_SCHEMA_NAME` |
| Calendar Manager | `tech/agents/mad-scheduler/` | `CALENDAR_MANAGER_ENVIRONMENT_ID`, `CALENDAR_MANAGER_SCHEMA_NAME` |
| Knowledge Base | `tech/agents/knowledge-base/` | `KNOWLEDGE_BASE_ENVIRONMENT_ID`, `KNOWLEDGE_BASE_SCHEMA_NAME` |

---

## Deployment Steps

### 1. Clone and install dependencies

```bash
cd tech/agents/a365-orchestrator
npm install
```

### 2. Configure environment variables

Copy the example file and fill in all values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `BOT_ID` | Entra ID application (client) ID for the orchestrator bot |
| `BOT_PASSWORD` | Entra ID client secret for the orchestrator bot |
| `TENANT_ID` | Azure AD tenant ID |
| `IT_HELP_DESK_ENVIRONMENT_ID` | Power Platform environment ID for IT Help Desk |
| `IT_HELP_DESK_SCHEMA_NAME` | Copilot Studio schema name for IT Help Desk |
| `CALENDAR_MANAGER_ENVIRONMENT_ID` | Power Platform environment ID for Calendar Manager |
| `CALENDAR_MANAGER_SCHEMA_NAME` | Copilot Studio schema name for Calendar Manager |
| `KNOWLEDGE_BASE_ENVIRONMENT_ID` | Power Platform environment ID for Knowledge Base |
| `KNOWLEDGE_BASE_SCHEMA_NAME` | Copilot Studio schema name for Knowledge Base |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection string for telemetry |
| `KEY_VAULT_URI` | Azure Key Vault URI for runtime secret retrieval |

### 3. Provision Azure infrastructure

```bash
teamsfx provision --env dev
```

This creates:
- Entra ID app registration (bot identity)
- Azure App Service (B1 tier by default)
- Azure Key Vault (stores bot credentials and backend connection strings)
- Application Insights (telemetry)
- Azure Bot Service (Teams channel)

### 4. Deploy the application

```bash
npm run build
teamsfx deploy --env dev
```

### 5. Publish to Microsoft Teams

```bash
teamsfx publish --env dev
```

Alternatively, submit the generated `appPackage/build/appPackage.dev.zip` for admin approval via the Teams Admin Center.

---

## Local Development

### Run with DevTools

```bash
npm run dev
```

Open `http://localhost:3979/devtools` to test conversations without a full Teams client.

### Run unit and integration tests

```bash
npm test
```

---

## Post-Deployment Validation

- [ ] Send "hello" — orchestrator greets and shows capability menu
- [ ] Send "reset my password" — routed to IT Help Desk
- [ ] Send "schedule a meeting tomorrow at 2pm" — routed to Calendar Manager
- [ ] Send "how do I configure VPN?" — routed to Knowledge Base
- [ ] Send "raise a support ticket" — routed to IT Help Desk with adaptive card
- [ ] Check Application Insights for routing telemetry events
- [ ] Verify Key Vault access policy allows the App Service managed identity

---

## Architecture Decisions

### Intent classification

The router (`src/router.ts`) uses keyword matching against predefined intent vocabularies for each specialist domain. This is intentionally lightweight — replace with an Azure OpenAI classifier for higher accuracy in production.

### Authentication flow

The orchestrator uses OBO (On-Behalf-Of) token exchange to forward the Teams user's identity to each Copilot Studio specialist agent, so backend agents respect the same Entra ID policies.

### State management

Conversation state is stored in-memory per bot instance. For production, replace with Azure Cosmos DB or Blob Storage by updating the `ConversationState` adapter in `src/index.ts`.

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review routing accuracy in App Insights | Weekly | Platform team |
| Update intent keyword vocabularies | As needed | Platform team |
| Rotate bot client secret in Key Vault | Every 90 days | Security team |
| Review specialist agent availability | Daily (automated alert) | Platform team |
| Licence and usage review | Quarterly | IT Admin |

### Key Application Insights queries

**Routing distribution by specialist agent:**

```kusto
customEvents
| where name == "AgentRouted"
| summarize count() by tostring(customDimensions.targetAgent)
| render piechart
```

**Average backend response latency:**

```kusto
customEvents
| where name == "AgentRoutingComplete"
| extend duration = toint(customDimensions.durationMs)
| summarize avg(duration) by tostring(customDimensions.targetAgent)
```

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Orchestrator not responding in Teams | Platform team | Microsoft Support |
| Specialist agent returning errors | Platform team | Copilot Studio Admin |
| Authentication failures | Entra ID Admin | Microsoft Identity team |
| Key Vault access denied | Security team | Azure platform team |

---

## Rollback Procedure

1. In the Azure portal, navigate to the App Service and switch to the previous deployment slot.
2. If a slot swap is not available, re-deploy the previous version:
   ```bash
   git checkout <previous-tag>
   npm run build
   teamsfx deploy --env dev
   ```
3. Verify routing is restored by re-running the post-deployment validation checks.
4. Notify the IT service desk team of the temporary reversion.
