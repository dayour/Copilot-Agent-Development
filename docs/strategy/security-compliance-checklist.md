# Security and Compliance Checklist

## Overview

This checklist defines the mandatory security and compliance controls for every Copilot Studio agent deployed from this repository. The checklist is organized by control domain and must be completed and signed off before production promotion for any agent, regardless of tier.

Controls marked "P0 Only" are mandatory only for P0 agents. All other controls apply to all tiers.

See [coe-governance.md](./coe-governance.md) for the governance process that enforces this checklist and [sla-definitions.md](./sla-definitions.md) for tier definitions.

---

## How to Use This Checklist

1. Copy this file to the agent's repository folder as `security-review-<version>.md` before a production promotion.
2. Complete each item for the target agent.
3. Attach the completed checklist to the production promotion pull request.
4. The CoE Admin reviews and countersigns before approving the promotion gate.
5. Retain the completed checklist in source control alongside the agent scaffold files.

---

## 1. DLP Policy Compliance

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 1.1 | A named DLP policy is assigned to the production environment | [ ] | Policy name: |
| 1.2 | Dataverse is in the Business data group | [ ] | Screenshot or policy export attached |
| 1.3 | SharePoint is in the Business data group | [ ] | |
| 1.4 | Office 365 Outlook is in the Business data group | [ ] | |
| 1.5 | Microsoft Teams is in the Business data group | [ ] | |
| 1.6 | HTTP connector is NOT in the Business data group (must be Non-business or Blocked) | [ ] | |
| 1.7 | All custom connectors used by this agent are explicitly assigned to a DLP group | [ ] | List connectors: |
| 1.8 | No personal email connectors (Gmail, Yahoo Mail) are in the Business data group | [ ] | |
| 1.9 | Social media connectors are in the Blocked group | [ ] | |
| 1.10 | DLP policy violations from the past 90 days have been reviewed and resolved | [ ] | Violation report date: |

### DLP Audit Command

```bash
# Export DLP policy assignments for an environment
pac admin list-dlp-policies --environment <environment-id> --output json
```

---

## 2. Authentication Mode Enforcement

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 2.1 | Authentication is enabled on the agent (authentication mode is not None, unless explicitly approved for internal-only read-only informational agents) | [ ] | Auth mode: |
| 2.2 | Manual authentication is NOT used in production (EntraID or service principal only) | [ ] | |
| 2.3 | For internal agents: Microsoft Entra ID (Azure AD) authentication is configured | [ ] | Tenant ID: |
| 2.4 | For external agents: Azure AD B2C or approved external identity provider is configured | [ ] | Provider: |
| 2.5 | Tenant restriction is applied for internal agents (agent is not accessible outside the tenant) | [ ] | |
| 2.6 | Service account credentials are stored in Azure Key Vault or Power Platform environment variable (secret type), not hardcoded in flows | [ ] | Key Vault reference or env var name: |
| 2.7 | API keys used by connected flows are rotated on the defined schedule (90 days or per connector policy) | [ ] | Last rotation date: |
| 2.8 | OAuth scopes for service principals are scoped to minimum required permissions (principle of least privilege) | [ ] | Scopes listed: |
| 2.9 | [P0 Only] Multi-factor authentication is enforced for all users accessing the agent's data in Dataverse | [ ] | Conditional Access policy name: |

---

## 3. Connector Certification

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 3.1 | All connectors used in flows are either Microsoft-certified or organization-certified | [ ] | List non-standard connectors: |
| 3.2 | Custom connectors have been reviewed by the security team | [ ] | Review date: |
| 3.3 | Custom connector definitions are stored in source control | [ ] | File path: |
| 3.4 | Custom connectors do not expose unauthenticated endpoints | [ ] | |
| 3.5 | Connector connection references are used in all flows (not embedded connections) | [ ] | |
| 3.6 | No connector retrieves data outside the defined data residency region | [ ] | Region: |
| 3.7 | Connectors that call external APIs implement error handling (try/catch, fallback response, error logging) | [ ] | |
| 3.8 | Rate limiting and throttling responses from connectors are handled gracefully in flows | [ ] | |

---

## 4. Data Residency Compliance

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 4.1 | The production Dataverse environment is hosted in the approved Azure region | [ ] | Region: |
| 4.2 | The region matches the data residency requirement for the vertical and data classification | [ ] | Requirement source: |
| 4.3 | No data is written to or read from Dataverse environments outside the approved region | [ ] | |
| 4.4 | External knowledge sources (SharePoint, Blob Storage) are co-located in the same region | [ ] | |
| 4.5 | Azure services used by this agent (Key Vault, Blob Storage, Azure AD B2C) are in the approved region | [ ] | |
| 4.6 | [P0 Only] A data residency compliance attestation has been completed for this agent | [ ] | Attestation date: |

---

## 5. Content Safety and Generative AI Controls

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 5.1 | Content safety filters are enabled for all generative answer nodes | [ ] | |
| 5.2 | The fallback topic does not expose system instructions, internal data, or error details | [ ] | |
| 5.3 | Generative orchestration is scoped to approved knowledge sources only (no public web search unless explicitly approved) | [ ] | Knowledge source list: |
| 5.4 | The agent instructions include an explicit grounding statement limiting responses to approved knowledge sources | [ ] | |
| 5.5 | Prompt injection resistance has been tested (attempt to make the agent reveal instructions or behave outside its defined scope) | [ ] | Test date and method: |
| 5.6 | The agent does not repeat PII back to the user in responses unless required for the specific workflow | [ ] | |
| 5.7 | Adaptive card inputs that capture user data are validated before being processed by flows | [ ] | |

---

## 6. Audit Log Retention and Review

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 6.1 | Power Platform audit logging is enabled for the production environment | [ ] | |
| 6.2 | Dataverse audit is enabled on tables that store sensitive data for this agent | [ ] | Tables audited: |
| 6.3 | Power Automate flow run history is retained for the required period (minimum 28 days; 7 years for Insurance vertical) | [ ] | Retention setting: |
| 6.4 | Azure AD sign-in logs are being exported to a Log Analytics workspace or SIEM | [ ] | Workspace name: |
| 6.5 | Audit logs have been reviewed in the past 30 days for anomalies | [ ] | Review date: |
| 6.6 | [P0 Only] An automated alert is configured for anomalous sign-in patterns | [ ] | Alert rule name: |
| 6.7 | Conversation transcripts are exported to Dataverse or Blob Storage per the retention policy defined in admin-governance.md | [ ] | Storage location: |

### Log Retention Requirements by Vertical

| Vertical | Retention Requirement | Basis |
| --- | --- | --- |
| Insurance | 7 years | Regulatory requirement for claims documentation |
| Tech | 90 days | Sales interaction records |
| Coffee | 30 days | Default |
| Clothing | 30 days | Default |
| Transportation | 30 days | Default |

---

## 7. Environment and Solution Security

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 7.1 | The solution is imported as a managed solution in production (not unmanaged) | [ ] | |
| 7.2 | Environment creation rights are restricted to IT Admins only | [ ] | |
| 7.3 | Security roles are assigned correctly: System Admin (IT), Environment Maker (authors), Basic User (testers) | [ ] | |
| 7.4 | The production environment does not contain development or test data | [ ] | |
| 7.5 | Environment variables of type Secret are used for all sensitive configuration values | [ ] | Variable names: |
| 7.6 | The deployment service account has the minimum required Power Platform roles | [ ] | Role: |
| 7.7 | The solution does not contain any hardcoded connection strings, API keys, or passwords | [ ] | Code scan date: |

---

## 8. Privacy and GDPR Compliance

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 8.1 | PII collected by the agent is limited to what is necessary for the agent's documented function | [ ] | PII fields listed: |
| 8.2 | Conversation data containing PII is classified at the appropriate sensitivity level | [ ] | Classification: |
| 8.3 | A Data Subject Access Request (DSAR) process is documented and tested | [ ] | Process document link: |
| 8.4 | A right-to-erasure process is documented and tested | [ ] | Process document link: |
| 8.5 | For external-facing agents: a pre-chat consent screen is displayed and consent is recorded in Dataverse | [ ] | |
| 8.6 | Cross-border data transfer controls are in place if users are in a jurisdiction with transfer restrictions | [ ] | |
| 8.7 | [P0 Only] A privacy impact assessment (PIA) has been completed for this agent | [ ] | PIA date: |

---

## 9. Penetration Testing and Security Validation

| # | Control | Status | Evidence |
| --- | --- | --- | --- |
| 9.1 | Prompt injection testing has been completed | [ ] | Test date: |
| 9.2 | Data leakage testing has been completed (attempted to access data outside authorized scope) | [ ] | Test date: |
| 9.3 | Authentication bypass testing has been completed | [ ] | Test date: |
| 9.4 | Rate limiting validation has been completed | [ ] | |
| 9.5 | [P0 Only] A formal penetration test by the security team or approved third party has been completed | [ ] | Report reference: |
| 9.6 | All critical and high findings from security testing have been remediated before production promotion | [ ] | Finding count at sign-off: Critical: 0 High: 0 |

---

## Sign-Off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Agent Owner | | | |
| CoE Admin | | | |
| Security Lead | | | |
| [P0 Only] IT Director | | | |

All signatories confirm that the controls above have been assessed, evidence has been reviewed, and any exceptions have been formally accepted with a documented risk acceptance.

---

## Exception Process

If a control cannot be met as documented, follow this process:

1. Document the control number, reason for exception, and proposed compensating control.
2. Submit the exception request to the CoE Admin and Security Lead.
3. The Security Lead approves or rejects the exception within 5 business days.
4. Approved exceptions are recorded in the `SecurityExceptions` Dataverse table with an expiry date (maximum 90 days).
5. The agent owner is responsible for remediating the root cause before the exception expires.
6. Expired exceptions without remediation block the next production promotion.

---

## Related Documents

- [CoE Governance Patterns](./coe-governance.md)
- [Agent Registry Template](./agent-registry-template.md)
- [SLA Definitions](./sla-definitions.md)
- [Admin and Governance Guide](../admin-governance.md)
- [Authentication Architecture](../authentication.md)
