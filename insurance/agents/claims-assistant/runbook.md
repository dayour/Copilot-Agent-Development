# Runbook — Claims Assistant (Insurance)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Claims Assistant agent for the Insurance vertical.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Automate | For policy management system integration |
| Azure AD | For authentication and adjuster routing |
| Dataverse environment | To store claim intake records and logs |
| Policy Management API | REST endpoint for claims status lookup |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region satisfies your data residency and compliance requirements.

### 2. Import the Solution
1. Go to **Solutions** → **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `PolicyManagementApiUrl` — REST endpoint of your policy management system
   - `ClaimsEscalationEmail` — distribution list for complex case escalations
   - `PolicyWordingLibraryUrl` — SharePoint URL for policy wording and FAQ documents
   - `DocumentStorageLibraryUrl` — SharePoint URL for storing uploaded claim evidence
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Knowledge Sources
1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** → **Add knowledge source**.
3. Add the SharePoint library containing policy wordings and FAQ documents.
4. Run a manual sync and confirm policy Q&A topics appear.

### 4. Configure Power Automate Flows
1. Open the **Get Claim Status** flow in Power Automate.
2. Update the HTTP action to point to `PolicyManagementApiUrl`.
3. Add authentication headers (OAuth2 or API key) as required by your system.
4. Test the flow end-to-end with a sample policy number.

### 5. Configure Authentication
1. In **Settings** → **Security** → **Authentication**, configure authentication appropriate for your channel (customer-facing channels may use Azure AD B2C).
2. For the internal Teams channel, restrict to your Azure AD tenant.

### 6. Publish
1. Navigate to **Channels** and enable the required channels (Teams for handlers, web chat for customers).
2. For the public web chat channel, generate the embed code and pass it to the web team.

---

## Post-Deployment Validation

- [ ] FNOL topic successfully collects incident type, date, and description
- [ ] Coverage Q&A topic returns accurate policy summaries
- [ ] Claim status topic connects to policy system and returns real data
- [ ] Document submission topic presents the upload prompt and validates file types
- [ ] Escalation topic transfers the conversation with full context to a claims handler
- [ ] Unrecognised inputs trigger the fallback and offer to connect to a human

---

## Monitoring & Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review CSAT and resolution rate | Weekly | Claims Operations Manager |
| Update policy wording knowledge base | On policy change | Product Owner |
| Review escalation rate | Weekly | Claims Team Lead |
| API connectivity health check | Daily (automated) | IT Admin |
| Licence & usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| Incorrect coverage information | Policy Team | Compliance Officer |
| API connectivity failure | IT Admin | Policy System Vendor |
| Data breach concern | IT Admin | CISO / DPO |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify claims handling team and web team of the temporary reversion.
