# Pipeline Analytics and Deal Coaching Agent Deployment Runbook

## 1. Purpose

This runbook covers end-to-end deployment, validation, monitoring, escalation, and rollback for the Pipeline Analytics and Deal Coaching Copilot Studio agent. The agent integrates with Salesforce CRM via Power Automate and is published to the Microsoft Teams internal channel.

## 2. Prerequisites

### 2.1 Platform and Licensing

- Copilot Studio license assigned to maker and service accounts
- Power Automate Premium licensing for Salesforce connector usage
- Dataverse environment with solution management enabled
- Microsoft Teams app publishing permissions

### 2.2 Identity Prerequisites

- Microsoft Entra ID tenant for internal users
- Sales team members assigned to the Teams channel audience

### 2.3 Salesforce Prerequisites

- Salesforce org access with admin permissions
- Salesforce Connected App created for OAuth 2.0 integration
- API-enabled Salesforce user or service account with read access to Opportunity, Task, Contact, and Account objects
- Stage probability values configured on Salesforce Opportunity stages for weighted forecast calculation
- Closed Lost reason picklist populated with standard loss reason values

## 3. Salesforce Connected App Setup

### 3.1 Create Connected App

1. In Salesforce Setup, open App Manager.
2. Create a new Connected App.
3. Enable OAuth Settings.
4. Set callback URL to Power Platform OAuth callback URL as required by connector configuration.
5. Enable OAuth scopes:
   - `api`
   - `refresh_token`

### 3.2 Capture Credentials

- Client ID (Consumer Key)
- Client Secret (Consumer Secret)
- Salesforce instance URL (for example, `https://your-instance.my.salesforce.com`)

### 3.3 Security Hardening

- Restrict IP ranges where feasible
- Use least-privilege permission set for integration principal: read-only on Opportunity, Task, Contact, Account
- Rotate client secret every 90 days

## 4. Solution Import and Environment Variables

### 4.1 Import Package

1. Open target Power Platform environment.
2. Import the Pipeline Analytics managed or unmanaged solution package.
3. Resolve connection references during import (Salesforce and Dataverse).

### 4.2 Set Environment Variables

Configure the following environment variables immediately after import:

| Variable Name | Example Value | Required |
|---|---|---|
| SalesforceClientId | `3MVG9...` | Yes |
| SalesforceClientSecret | Stored as secret | Yes |
| SalesforceInstanceUrl | `https://company.my.salesforce.com` | Yes |
| ForecastHistoryTableName | `crf_StageConversionRates` | Yes |
| CoachingThresholdDays | `14` | Yes |

### 4.3 Secret Storage

- Store `SalesforceClientSecret` in the environment secret store or Key Vault-backed configuration.
- Restrict maker access to environments containing production secrets.

## 5. Dataverse Configuration

### 5.1 Stage Conversion Rate Table

- Table: `crf_StageConversionRates`
- Populate with historical conversion rates per Salesforce opportunity stage.
- Used by the Forecast Roll-Up flow to calculate weighted and best-case scenarios.

### 5.2 Deal Coaching Patterns Table

- Table: `crf_DealCoachingPatterns`
- Populate with baseline patterns derived from historical closed deals.
- Fields include: inactivity threshold, activity-to-close-rate correlation, typical competitor impact values.

## 6. Authentication Setup

- Configure agent authentication with Microsoft Entra ID.
- Enable SSO for Teams channel.
- Confirm user claims include user principal name, display name, and Salesforce user ID mapping.

## 7. Channel Configuration

1. Publish agent to Microsoft Teams.
2. Restrict access to internal sales team via Teams app permission policy.
3. Validate all topic behaviors and Salesforce query flows.

## 8. Validation Checklist

| Check | Expected Result | Status |
|---|---|---|
| Salesforce OAuth connection | Connection successful and token refresh working | Pending |
| Pipeline Summary flow | Stage breakdown, total value, and weighted forecast returned | Pending |
| Deals closing this month | Correctly filtered by current month close date | Pending |
| Deal Health Check flow | Activity recency, stakeholder count, competitor mentions returned | Pending |
| Risk assessment logic | High, medium, and low risk computed correctly | Pending |
| Deal Coaching nudge | Activity gap and close rate impact message generated | Pending |
| Forecast Roll-Up flow | Rep-level aggregation with weighted and best-case values returned | Pending |
| Win/Loss Analysis flow | Closed Lost opportunities with loss reasons and competitor tags returned | Pending |
| Teams SSO | User identity resolved without manual re-auth | Pending |

## 9. Monitoring Cadence

### 9.1 Daily

- Review failed Power Automate flow runs for Salesforce queries
- Review topic fallback and unresolved query rate

### 9.2 Weekly

- Review topic trigger distribution
- Review forecast accuracy delta between agent-reported and actual close rates
- Review coaching nudge engagement rate (users who acted on coaching messages)

### 9.3 Monthly

- Credential and connection health review
- Refresh stage conversion rate and coaching pattern tables from latest closed-deal data
- Governance and access audit

## 10. Escalation Matrix

| Severity | Example | Owner | Response Target |
|---|---|---|---|
| Sev 1 | Agent unavailable in Teams | Platform Operations Lead | 15 minutes |
| Sev 2 | Salesforce query flows failing | Integration Owner | 1 hour |
| Sev 3 | Forecast or risk logic incorrect | Copilot Studio Product Owner | 1 business day |
| Sev 4 | Coaching content update request | Sales Enablement Content Owner | 2 business days |

## 11. Rollback Procedure

1. Stop new publishes and freeze maker changes.
2. Revert to previously exported stable solution version.
3. Restore previous environment variable values if modified.
4. Rebind known-good Salesforce and Dataverse connection references.
5. Republish Teams channel.
6. Execute smoke tests:
   - Pipeline Summary query
   - Deal Health Check by deal name
   - Forecast Roll-Up for current quarter
7. Notify stakeholders and document incident RCA.

## 12. Post-Deployment Handover

- Provide runbook and support ownership contacts to sales operations team.
- Store latest solution export and config snapshot in release repository.
- Confirm monitoring dashboards and alert routing are active.
- Schedule initial data population for stage conversion rate and coaching pattern tables.
