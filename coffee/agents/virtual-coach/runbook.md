# Runbook — Virtual Coach (Coffee)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Virtual Coach agent for the Coffee vertical.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Automate | For any back-end data connectors |
| Azure AD | For authentication and user lookup |
| Dataverse environment | To store conversation logs and knowledge |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region matches your data residency requirements.

### 2. Import the Solution
1. Go to **Solutions** → **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map any environment variables (e.g., SharePoint site URL for knowledge base).
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Knowledge Sources
1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** → **Add knowledge source**.
3. Add the SharePoint site or document library containing coffee preparation guides and HR policies.
4. Run a manual sync and verify topic suggestions appear.

### 4. Customise Topics
1. Review each topic in `templates/agent-template.yaml`.
2. Update trigger phrases to match your shop's terminology.
3. Replace placeholder menu items with your actual drink names and recipes.

### 5. Configure Authentication
1. In **Settings** → **Security** → **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Azure AD tenant.

### 6. Publish to Microsoft Teams
1. Navigate to **Channels** → **Microsoft Teams**.
2. Click **Turn on Teams**.
3. Submit for admin approval if required by your tenant policy.
4. Test the agent by messaging it directly in Teams.

---

## Post-Deployment Validation

- [ ] Agent responds to "Hello" with the welcome message
- [ ] Drink recipe topic returns correct preparation steps
- [ ] HR policy topic returns policy summaries from the knowledge source
- [ ] Handover checklist topic generates a structured list
- [ ] Unrecognised inputs trigger the escalation / fallback topic
- [ ] Authentication correctly restricts access to tenant employees

---

## Monitoring & Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review conversation analytics | Weekly | Operations Manager |
| Update drink recipes | On menu change | Training Lead |
| Retrain/refresh knowledge sources | Monthly | IT Admin |
| Review unrecognised inputs report | Bi-weekly | Copilot Studio Admin |
| Licence & usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| Incorrect recipe information | Training Lead | Content Owner |
| Authentication failure | IT Admin | Azure AD Admin |
| Data residency concern | IT Admin | Compliance Officer |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify affected users via the team channel.
