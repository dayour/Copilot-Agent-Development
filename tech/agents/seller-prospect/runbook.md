# Seller Prospect Agent Deployment Runbook

## 1. Purpose
This runbook describes end-to-end deployment, validation, monitoring, escalation, and rollback for the Seller Prospect Copilot Studio agent with Salesforce integration and dual-channel publishing (Teams internal, external web chat).

## 2. Prerequisites

## 2.1 Platform and Licensing
- Copilot Studio license assigned to maker and service accounts
- Power Automate Premium licensing for Salesforce connector usage
- Dataverse environment with solution management enabled
- Microsoft Teams app publishing permissions

## 2.2 Identity and Channel Prerequisites
- Microsoft Entra ID tenant for internal users
- Azure AD B2C tenant for external website user authentication
- Verified external website domain for web chat embed

## 2.3 Salesforce Prerequisites
- Salesforce org access with admin permissions
- Salesforce Connected App created for OAuth 2.0 integration
- API-enabled Salesforce user/service account
- Network and policy approval for API access from Power Platform

## 3. Salesforce Connected App Setup

## 3.1 Create Connected App
1. In Salesforce Setup, open App Manager.
2. Create a new Connected App.
3. Enable OAuth Settings.
4. Set callback URL to Power Platform OAuth callback URL as required by connector configuration.
5. Enable OAuth scopes:
   - `api`
   - `refresh_token`

## 3.2 Capture Credentials
- Client ID (Consumer Key)
- Client Secret (Consumer Secret)
- Salesforce instance URL (for example, `https://your-instance.my.salesforce.com`)

## 3.3 Security Hardening
- Restrict IP ranges where feasible
- Use least-privilege profile/permission set for integration principal
- Rotate client secret every 90 days

## 4. Solution Import and Environment Variables

## 4.1 Import Package
1. Open target Power Platform environment.
2. Import the Seller Prospect managed or unmanaged solution package.
3. Resolve connection references during import.

## 4.2 Set Environment Variables
Configure the following environment variables immediately after import:

| Variable Name | Example Value | Required |
|---|---|---|
| SalesforceClientId | `3MVG9...` | Yes |
| SalesforceClientSecret | Stored as secret | Yes |
| SalesforceInstanceUrl | `https://company.my.salesforce.com` | Yes |
| AzureAdB2cTenantId | `contosoexternal.onmicrosoft.com` | Yes |
| ProspectWebsiteDomain | `https://www.contoso.com` | Yes |

## 4.3 Secret Storage
- Store `SalesforceClientSecret` in environment secret store/Key Vault-backed configuration when available.
- Restrict maker access to environments containing production secrets.

## 5. Knowledge Source Configuration

## 5.1 Public Product Library
- Source type: Public-safe website/doc library
- Contents:
  - Product overview pages
  - Public pricing guidance
  - Approved case studies
  - Public compliance statements
- Used by: External Prospect Chat and qualification support

## 5.2 Internal Competitive Intelligence Library
- Source type: Internal SharePoint/Dataverse restricted source
- Contents:
  - Battlecards
  - Competitor objection handling
  - Internal win/loss playbooks
- Used by: Internal Teams topics only

## 5.3 Boundary Controls
- External channel must not query internal competitive sources.
- Validate source visibility by channel during UAT.

## 6. Authentication Setup

## 6.1 Internal Authentication (Teams)
- Configure agent authentication with Microsoft Entra ID.
- Enable SSO for Teams channel.
- Confirm claims include user principal name and display name.

## 6.2 External Authentication (Web Chat)
- Configure Azure AD B2C as external identity provider.
- Support progressive journey:
  - Anonymous entry for discovery
  - Prompted sign-in before sensitive lead operations
- Enforce domain and redirect URI alignment with `ProspectWebsiteDomain`.

## 7. Channel Configuration

## 7.1 Teams Channel
1. Publish agent to Teams.
2. Validate internal topic behavior and Salesforce actions.
3. Confirm only internal users can access rep workflows.

## 7.2 External Custom Website Channel
1. Enable custom website channel in Copilot Studio.
2. Generate embed script and configure allowed origins.
3. Embed script into approved website pages.
4. Validate B2C sign-in, session continuity, and channel-specific topic restrictions.

## 8. Validation Checklist

| Check | Expected Result | Status |
|---|---|---|
| Salesforce OAuth connection | Connection successful and token refresh working | Pending |
| Create Salesforce Lead flow | Lead created with BANT fields mapped | Pending |
| Opportunity lookup | Opportunity details returned in under 6 seconds typical | Pending |
| Pipeline summary | Aggregation by stage and amount correct | Pending |
| Deal health check | Risk flags shown based on activity and engagement | Pending |
| Meeting scheduler | Suggested times align with rep calendar availability | Pending |
| External public-safe response | No internal-only content returned | Pending |
| Escalation flow | Handoff creates Teams queue notification | Pending |
| Teams SSO | User identity resolved without manual re-auth | Pending |
| B2C journey | Anonymous-to-authenticated transition works | Pending |

## 9. Monitoring Cadence

## 9.1 Daily
- Review failed flow runs (Salesforce and scheduling flows)
- Review escalation volume and unresolved escalations

## 9.2 Weekly
- Review topic trigger distribution and fallback rates
- Review BANT completion rate and lead conversion trend
- Review channel split (Teams vs external web)

## 9.3 Monthly
- Credential and connection health review
- Knowledge source freshness review
- Governance and access audit (maker, admin, connection owners)

## 10. Escalation Matrix

| Severity | Example | Owner | Response Target |
|---|---|---|---|
| Sev 1 | Production outage, no channel response | Platform Operations Lead | 15 minutes |
| Sev 2 | Salesforce create/update failures | Integration Owner | 1 hour |
| Sev 3 | Topic quality degradation, routing drift | Copilot Studio Product Owner | 1 business day |
| Sev 4 | Content update request | Sales Enablement Content Owner | 2 business days |

## 11. Rollback Procedure
1. Stop new publishes and freeze maker changes.
2. Revert to previously exported stable solution version.
3. Restore previous environment variable values if modified.
4. Rebind known-good connection references.
5. Republish channels (Teams and web chat).
6. Execute smoke tests:
   - Greeting by channel
   - Lead create
   - Opportunity lookup
   - Prospect public Q and A
7. Notify stakeholders and document incident RCA.

## 12. Post-Deployment Handover
- Provide runbook and support ownership contacts.
- Store latest solution export and config snapshot in release repository.
- Confirm monitoring dashboards and alert routing are active.
