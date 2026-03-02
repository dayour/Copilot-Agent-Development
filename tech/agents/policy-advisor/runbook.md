# Runbook -- Policy Advisor (Tech)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Policy Advisor agent for the Tech vertical.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Platform environment | Dataverse-enabled environment for Dev, Sandbox, and Prod |
| SharePoint Online | Access to policy document libraries (HR, Legal, Operations) |
| Microsoft Entra ID | For authentication and user/group access control |
| Company website | Public or intranet policy pages at a known URL |
| Power Automate | For escalation flows and notification triggers |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment

1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment (start with the Dev environment).
3. Confirm the environment region matches your data residency requirements.
4. Verify your account has the **Copilot Studio Maker** role assigned.

### 2. Create the Agent

1. Click **Create** > **New agent**.
2. Set the agent name to **Policy Advisor**.
3. Set the description: "Assists employees with accurate, policy-compliant guidance on HR, Legal, and company policies."
4. Select **English** as the language.
5. Select **GPT-5 Chat** as the model under **Settings** > **Generative AI**.

### 3. Configure Agent Instructions

1. Open the agent overview page.
2. Paste the V1 instructions from `config-guide.md` Section 5 into the **Instructions** field.
3. Save and run a quick test with: "What is the company's remote work policy?"
4. Verify the agent attempts to search knowledge sources and provides a structured response.

### 4. Import the Solution

1. Go to **Solutions** > **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `SharePointPolicyLibraryUrl` -- SharePoint URL for policy document libraries
   - `CompanyWebsiteUrl` -- Company website URL (e.g., `https://company.example.com`)
   - `EscalationTeamsChannelId` -- Teams channel ID for HR/Legal escalations
   - `HrContactEmail` -- HR department contact email
   - `LegalContactEmail` -- Legal department contact email
4. Complete the import and verify all components show **Healthy**.

### 5. Configure Knowledge Sources

#### Public Website

1. Open the agent in Copilot Studio.
2. Navigate to **Knowledge** > **Add knowledge source**.
3. Select **Public website**.
4. Enter the company website URL: `https://company.example.com`
5. Write a descriptive summary: "Corporate policy website containing published HR, Legal, and operational policies accessible to all employees."
6. Save and verify content is indexed.

#### SharePoint Libraries

1. Navigate to **Knowledge** > **Add knowledge source**.
2. Select **SharePoint**.
3. Add the HR Policy Library:
   - URL: Your SharePoint HR policy site/library URL
   - Description: "Internal HR policies including employee handbook, compensation, benefits, leave, and workplace conduct."
4. Add the Legal Compliance Library:
   - URL: Your SharePoint Legal policy site/library URL
   - Description: "Legal and regulatory compliance documents including data privacy, corporate governance, and contractual policies."
5. Add the Operations Policy Library (optional):
   - URL: Your SharePoint Operations policy site/library URL
   - Description: "Operational procedures including remote work, travel, procurement, and facility management."
6. Run a manual sync for each source and confirm documents are indexed.

#### Enable Web Search

1. Navigate to **Settings** > **Generative AI**.
2. Enable **Web search** as a supplementary knowledge source.

NOTE: Write meaningful, descriptive summaries for each knowledge source. Do not accept auto-generated descriptions.

### 6. Define Topics

1. Create topics based on the template in `templates/agent-template.yaml`.
2. At minimum, configure these topics:
   - Greeting
   - Policy Inquiry (general)
   - HR Policy Lookup
   - Legal Compliance Query
   - Workplace Accommodations
   - Benefits and Leave
   - Escalation to Human Agent
3. Test each topic individually with representative trigger phrases.

### 7. Configure Authentication

1. In **Settings** > **Security** > **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Entra ID tenant to ensure only employees can interact.
3. Optionally configure group-based access if you want to restrict to specific security groups.

### 8. Publishing

Complete the 10-item polishing checklist (see `config-guide.md` Section 7):

1. Verify agent name, icon, and color.
2. Set developer name, website URL, privacy statement URL, and terms of use URL.
3. Write short and long descriptions.
4. Enable channels:
   - **Microsoft Teams**: Navigate to **Channels** > **Microsoft Teams** > **Turn on Teams**.
   - **M365 Copilot**: Enable the M365 Copilot channel.
   - **SharePoint**: Embed the web chat component on target SharePoint pages.
5. Click **Publish**.
6. Submit for admin approval if required by tenant policy.

### 9. ALM Pipeline Setup

1. Navigate to the **Solutions** page in Copilot Studio.
2. Create the solution **PolicyAdvisor** (version 1.0.0.1) in the Dev environment.
3. Add all agent components to the solution.
4. Configure the deployment pipeline:
   - **Stage 1**: Export managed solution from Dev.
   - **Stage 2**: Import to Sandbox for functional validation.
   - **Stage 3**: After approval, import to Production.
5. Run solution checker before each export to validate.

---

## Post-Deployment Validation

- [ ] General policy inquiry returns relevant results with citations
- [ ] HR policy lookup correctly identifies and summarizes HR documents
- [ ] Legal compliance query retrieves legal and regulatory policy content
- [ ] Workplace accommodations topic provides ADA and accessibility guidance
- [ ] Benefits and leave topic returns accurate PTO, FMLA, and benefits information
- [ ] Escalation to HR/Legal hands off to the correct Teams channel or contact
- [ ] Web search supplements internal results when internal sources have no match
- [ ] Authentication restricts access to authorized employees only
- [ ] Agent is accessible via Microsoft Teams, M365 Copilot, and SharePoint

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review conversation analytics and resolution rates | Weekly | Agent Admin |
| Update policy documents in SharePoint libraries | On policy change | HR/Legal Team |
| Re-sync knowledge sources after document updates | On change | Agent Admin |
| Review unrecognised inputs and fallback triggers | Bi-weekly | Agent Admin |
| Validate knowledge source availability | Daily (automated) | Platform Admin |
| Review escalation volume and response times | Weekly | HR/Legal Manager |
| Licence and usage review | Quarterly | Platform Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | Platform Admin | Microsoft Support |
| Incorrect policy content returned | Agent Admin | Knowledge Owner (HR/Legal) |
| Knowledge source sync failure | Platform Admin | SharePoint Admin |
| Authentication failure | Platform Admin | Entra ID Admin |
| Channel publishing issue | Agent Admin | Microsoft Support |
| Escalation flow not triggering | Agent Admin | Power Automate Admin |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions**.
2. Unpublish the current agent version.
3. Remove the current managed solution from the Production environment.
4. Re-import the previous managed solution version from source control.
5. Re-publish the agent on all channels.
6. Verify the rollback by testing core policy inquiry flows.
7. Notify HR and Legal teams of the temporary reversion and any impact to policy guidance availability.

---

## Appendix: Environment Variable Reference

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `SharePointPolicyLibraryUrl` | SharePoint URL for policy document libraries | `https://company.sharepoint.com/sites/policies` |
| `CompanyWebsiteUrl` | Company website URL for public policy pages | `https://company.example.com` |
| `EscalationTeamsChannelId` | Teams channel ID for HR/Legal escalations | `19:abc123@thread.tacv2` |
| `HrContactEmail` | HR department contact email | `hr@company.example.com` |
| `LegalContactEmail` | Legal department contact email | `legal@company.example.com` |
