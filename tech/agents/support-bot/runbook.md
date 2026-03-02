# Runbook — SupportBot (Tech)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the SupportBot multi-agent orchestration agent for the Tech vertical. SupportBot serves as the primary support entry point, routing to WarrantyGuard for warranty issues and escalating complex cases to human agents.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user with generative AI capabilities |
| Power Automate | For escalation flows and case management automation |
| Entra ID (Azure AD) | For authentication, user and group lookup |
| Dataverse environment | To store conversation logs, case data, and configuration |
| WarrantyGuard agent | Deployed and accessible in the same environment for multi-agent handoff |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment

1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment (DYdev26).
3. Confirm the environment region matches your data residency requirements.
4. Verify generative AI features are enabled for the environment.

### 2. Import the Solution

1. Go to **Solutions** > **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `WarrantyGuardAgentId` — Agent ID of the deployed WarrantyGuard agent
   - `EscalationTeamsChannelId` — Teams channel ID for complex case escalations
   - `KnowledgeBaseUrl` — URL for the support knowledge base content
   - `ApplicationInsightsConnectionString` — Application Insights connection string for telemetry
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Knowledge Sources

1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** > **Add knowledge source**.
3. Add the configured knowledge base containing support articles, FAQs, and troubleshooting guides.
4. Run a manual sync and confirm knowledge-search topics return relevant results.

### 4. Configure Power Automate Flows

1. Open the **Escalate to Human Agent** flow in Power Automate.
2. Configure the Teams adaptive card to post to `EscalationTeamsChannelId`.
3. Open the **Create Support Case** flow and connect to your case management system.
4. Test each flow end-to-end: trigger the flow and confirm the expected outcome.

### 5. Configure Authentication

1. In **Settings** > **Security** > **Authentication**, select **Authenticate with Microsoft**.
2. Configure Entra ID tenant restriction to ensure only authorised users can interact.
3. Verify web channel security tokens are configured for embedded deployments.

### 6. Enable Multi-Agent Orchestration

1. Navigate to **Settings** > **Generative AI** > **Connected agents**.
2. Toggle Connected agents to **ON**.
3. Navigate to **Settings** > **Skills**.
4. Add WarrantyGuard as a registered skill using its agent ID.
5. Navigate to **Settings** > **Security** > **Allowlist**.
6. Enable the allowlist and add WarrantyGuard to the permitted agents list.
7. Return to **Settings** > **Generative AI** > **Responses**.
8. Add formatting instructions that include orchestration routing guidance (when to invoke WarrantyGuard, when to escalate, and response structure).
9. Test the full handoff flow: submit a warranty-related query and verify SupportBot routes to WarrantyGuard.

### 7. Publish to Channels

1. Navigate to **Channels** > **Microsoft Teams**.
2. Click **Turn on Teams** and submit for admin approval if required.
3. Navigate to **Channels** > **Custom website**.
4. Configure the web chat embed code for customer-facing deployments.
5. Test by messaging the agent on each channel with sample queries.

---

## Post-Deployment Validation

- [ ] General support inquiry returns a relevant generative AI response
- [ ] Warranty-related query is correctly routed to WarrantyGuard via connected agents
- [ ] WarrantyGuard returns a response and control returns to SupportBot
- [ ] Complex case escalation posts to the designated Teams channel
- [ ] Knowledge base search returns semantically relevant articles
- [ ] Feedback collection captures customer satisfaction rating
- [ ] Authentication blocks unauthorised users
- [ ] Application Insights receives telemetry events from both agents
- [ ] Web chat channel renders correctly in the embedded deployment
- [ ] Teams channel responds within acceptable latency

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review multi-agent handoff success rate | Weekly | Support Operations Manager |
| Review escalation volume and resolution times | Weekly | Support Operations Manager |
| Update knowledge base articles | On content change | Knowledge Owner |
| Application Insights health check | Daily (automated) | Platform Admin |
| Review unrecognised inputs and fallback rate | Bi-weekly | Copilot Studio Admin |
| WarrantyGuard connectivity check | Daily (automated) | Platform Admin |
| Licence and usage review | Quarterly | Platform Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | Platform Admin | Microsoft Support |
| WarrantyGuard handoff failure | Platform Admin | WarrantyGuard Owner |
| Knowledge base content incorrect | Knowledge Owner | Support Operations Manager |
| Authentication failure | Platform Admin | Entra ID Admin |
| Power Automate flow failure | Platform Admin | Power Platform Admin |
| Application Insights data missing | Platform Admin | Azure Admin |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the SupportBot agent.
2. Disable the WarrantyGuard skill registration and connected agents toggle.
3. Restore the previous solution version from source control.
4. Re-import and re-publish the previous version.
5. Notify the support operations team of the temporary reversion and expected restoration timeline.
