# Runbook — Knowledge Base (Tech)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Knowledge Base agent for the Tech vertical. The agent performs semantic search over SharePoint-hosted internal documentation and is designed to be consumed by the A365 Orchestrator as a specialist backend.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + SharePoint included |
| Copilot Studio licence | Per-tenant or per-user |
| SharePoint Online | Document libraries with internal documentation |
| Azure AD | For authentication |
| Dataverse environment | To store conversation logs |

---

## Deployment Steps

### 1. Provision the Copilot Studio environment

1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region matches your data residency requirements.

### 2. Import the solution

1. Go to **Solutions** -> **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `KnowledgeBaseSharePointUrl` — SharePoint site URL containing documentation libraries
   - `EscalationEmail` — email address for unanswered question escalations
4. Complete the import and verify all components show **Healthy**.

### 3. Configure knowledge sources

1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** -> **Add knowledge source**.
3. Add each SharePoint document library:
   - IT policies and procedures
   - HR policies
   - How-to guides and tutorials
   - FAQ documents
4. Run a manual sync and confirm search topics are populated.

### 4. Configure authentication

1. In **Settings** -> **Security** -> **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Azure AD tenant.

### 5. Connect to A365 Orchestrator (optional)

If this agent will be consumed by the A365 Orchestrator:

1. Note the Copilot Studio environment ID and schema name.
2. Add these values to the A365 Orchestrator `.env` file:
   - `KNOWLEDGE_BASE_ENVIRONMENT_ID`
   - `KNOWLEDGE_BASE_SCHEMA_NAME`
3. Restart the orchestrator to pick up the new configuration.

### 6. Publish to Microsoft Teams

1. Navigate to **Channels** -> **Microsoft Teams**.
2. Click **Turn on Teams**.
3. Submit for admin approval if required.
4. Test by asking a question such as "How do I configure VPN?".

---

## Post-Deployment Validation

- [ ] Policy search returns relevant policy documents
- [ ] How-to guide search returns step-by-step instructions
- [ ] FAQ topic surfaces instant answers without browsing
- [ ] Escalation topic sends email for unanswered questions
- [ ] A365 Orchestrator routes knowledge queries here correctly

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review unanswered questions report | Weekly | Knowledge Owner |
| Add new documents to SharePoint | On knowledge change | Content Owner |
| Run manual knowledge sync | After document updates | Copilot Studio Admin |
| Review topic accuracy | Bi-weekly | Knowledge Owner |
| Licence and usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| Search returns irrelevant results | Knowledge Owner | Copilot Studio Admin |
| SharePoint sync failure | SharePoint Admin | Microsoft Support |
| Authentication failure | Azure AD Admin | Microsoft Identity team |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify the Knowledge Owner and Copilot Studio Admin.
