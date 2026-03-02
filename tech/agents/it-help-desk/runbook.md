# Runbook — IT Help Desk (Tech)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the IT Help Desk agent for the Tech vertical.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Automate | For ITSM ticket creation flows |
| Azure AD | For authentication, user & group lookup |
| Dataverse environment | To store conversation and ticket logs |
| ITSM Platform | ServiceNow or Jira Service Management with API access |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region matches your data residency requirements.

### 2. Import the Solution
1. Go to **Solutions** → **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `ItsmApiUrl` — REST base URL of your ITSM platform
   - `ItsmApiKey` — API key or OAuth2 client credentials
   - `KnowledgeBaseSharePointUrl` — SharePoint URL for KB articles
   - `EscalationTeamsChannelId` — Teams channel ID for L2 escalations
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Knowledge Sources
1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** → **Add knowledge source**.
3. Add the SharePoint library containing internal KB articles, FAQs, and how-to guides.
4. Run a manual sync and confirm knowledge-search topics are populated.

### 4. Configure Power Automate Flows
1. Open the **Create ITSM Ticket** flow in Power Automate.
2. Update the HTTP action to point to `ItsmApiUrl`.
3. Add authentication headers (API key / OAuth2) as required.
4. Test end-to-end: trigger the flow and confirm a ticket is created in your ITSM platform.

### 5. Configure Authentication
1. In **Settings** → **Security** → **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Azure AD tenant to ensure only employees can interact.

### 6. Publish to Microsoft Teams
1. Navigate to **Channels** → **Microsoft Teams**.
2. Click **Turn on Teams**.
3. Submit for admin approval if required.
4. Test by messaging the agent and raising a sample incident.

---

## Post-Deployment Validation

- [ ] Password reset topic completes the self-service reset flow
- [ ] Software support topic returns relevant KB articles
- [ ] Hardware request topic initiates the approval workflow
- [ ] Incident logging topic creates a ticket in the ITSM platform with correct categorisation
- [ ] Knowledge base search returns semantically relevant articles
- [ ] Escalation to L2 via Teams channel functions correctly

---

## Monitoring & Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review deflection rate vs ticket volume | Weekly | IT Service Desk Manager |
| Update KB articles | On knowledge change | IT Admin |
| API connectivity health check | Daily (automated) | IT Admin |
| Review unrecognised inputs | Bi-weekly | Copilot Studio Admin |
| Licence & usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| ITSM integration failure | IT Admin | ITSM Platform Vendor |
| Incorrect KB content | IT Admin | Knowledge Owner |
| Authentication failure | IT Admin | Azure AD Admin |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify the IT service desk team of the temporary reversion.
