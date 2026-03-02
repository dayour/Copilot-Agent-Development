# DLP Policy Templates

## Overview
This document defines the Data Loss Prevention (DLP) connector policies for each environment tier across all verticals (Coffee, Clothing, Insurance, Tech, Transportation). It specifies which connector categories are allowed, restricted, or blocked per tier, and provides per-vertical notes where connector requirements differ from the default policy.

## Connector Category Definitions

| Category | Description |
|----------|-------------|
| Standard connectors | Microsoft-published connectors in the Business data group (Dataverse, SharePoint, Office 365, Teams, Power BI, Outlook, Azure services) |
| Custom connectors | Organisation-built connectors for internal or partner APIs (fuel card, telematics, claims core, Salesforce, ServiceNow) |
| HTTP connector | Generic HTTP/HTTPS request connector -- powerful but unaudited; must be restricted outside Dev |
| AI Builder | AI Builder prediction, document processing, and image recognition actions |
| Social/Personal | Social media, personal email, and consumer application connectors |

## Default Policy by Environment Tier

This is the baseline policy applied to all verticals. Per-vertical overrides are listed in the section below.

| Connector Category | Dev | Test/UAT | Production |
|-------------------|-----|----------|------------|
| Standard connectors | Allowed | Allowed | Allowed |
| Custom connectors | Allowed | Case-by-case approval | Approved custom connectors only |
| HTTP connector | Allowed | Restricted (read-only GET, no external write) | Blocked -- use approved custom connectors |
| AI Builder | Allowed | Allowed | Approved models only |
| Social/Personal connectors | Blocked | Blocked | Blocked |

### Policy Notes

**Dev -- Permissive**
The Dev environment uses a permissive policy to enable rapid prototyping. Builders may use the HTTP connector and unapproved custom connectors to explore integration patterns before a formal custom connector is built. This policy must never be applied to Test/UAT or Production.

**Test/UAT -- Production-Equivalent**
The Test/UAT DLP policy mirrors the Production policy in all areas that affect agent behaviour. This ensures integration issues caused by connector restrictions are caught during UAT rather than at go-live. The only difference from Production is that restricted HTTP connector access may be retained if an approved custom connector replacement is still in review -- this must be explicitly documented and time-bound.

**Production -- Strict**
The production policy is locked down. The HTTP connector is blocked entirely to prevent unaudited data exfiltration paths. All custom connectors used in production must have completed the approval process described in the Custom Connector Approval section below.

## Per-Vertical Connector Inventory

### Coffee -- Virtual Coach

| Connector | Type | Dev | Test/UAT | Production |
|-----------|------|-----|----------|------------|
| SharePoint | Standard | Allowed | Allowed | Allowed |
| Microsoft Teams | Standard | Allowed | Allowed | Allowed |
| Office 365 Outlook | Standard | Allowed | Allowed | Allowed |
| Dataverse | Standard | Allowed | Allowed | Allowed |
| HTTP | HTTP | Allowed | Restricted | Blocked |

Notes: No custom connectors required. The virtual coach relies on SharePoint knowledge grounding and Dataverse lists. HTTP access in Dev is used for prototype recipe API exploration only.

### Clothing -- Power Analysis

| Connector | Type | Dev | Test/UAT | Production |
|-----------|------|-----|----------|------------|
| Dataverse | Standard | Allowed | Allowed | Allowed |
| Power BI | Standard | Allowed | Allowed | Allowed |
| AI Builder (forecasting) | AI Builder | Allowed | Allowed | Approved model only |
| HTTP | HTTP | Allowed | Restricted | Blocked |

Notes: Power BI DAX query API access is managed through the Power BI connector (standard). AI Builder forecasting model must be explicitly approved before promotion to Production -- unapproved or experimental models are blocked in the production environment variable for the AI Builder action.

### Insurance -- Claims Assistant

| Connector | Type | Dev | Test/UAT | Production |
|-----------|------|-----|----------|------------|
| Dataverse | Standard | Allowed | Allowed | Allowed |
| Office 365 Outlook | Standard | Allowed | Allowed | Allowed |
| Claims Core API Connector | Custom | Allowed | Approved | Approved |
| AI Builder (OCR/document) | AI Builder | Allowed | Allowed | Approved model only |
| HTTP | HTTP | Allowed | Restricted | Blocked |
| Azure AD B2C (external channel) | Standard | Allowed | Allowed | Allowed |

Notes: The Claims Core API connector requires security sign-off before use in Test/UAT because it connects to real (non-production) claims data in the staging claims system. The AI Builder document intelligence model must be version-pinned in Production -- automatic model updates are disabled.

### Tech -- Seller Prospect and IT Help Desk

| Connector | Type | Dev | Test/UAT | Production |
|-----------|------|-----|----------|------------|
| Salesforce (Seller Prospect) | Custom | Allowed | Approved | Approved |
| ServiceNow / Jira (IT Help Desk) | Custom | Allowed | Approved | Approved |
| Dataverse | Standard | Allowed | Allowed | Allowed |
| Microsoft Teams | Standard | Allowed | Allowed | Allowed |
| Azure AD B2C (external web chat) | Standard | Allowed | Allowed | Allowed |
| HTTP | HTTP | Allowed | Restricted | Blocked |

Notes: Salesforce and ServiceNow/Jira connectors must use OAuth 2.0 with minimum required scope. Connection references are used (not embedded connections) so that credentials can be re-mapped per environment without re-importing the solution. The HTTP connector in Dev is permitted for Salesforce API exploration using test sandbox credentials only -- no production Salesforce credentials are used in Dev.

### Transportation -- Fuel Tracking and Fleet Coordinator

| Connector | Type | Dev | Test/UAT | Production |
|-----------|------|-----|----------|------------|
| Fuel Card API Connector | Custom | Allowed | Approved | Approved |
| Telematics API Connector | Custom | Allowed | Approved | Approved |
| Fuel Price API Connector | Custom | Allowed | Approved | Approved |
| Dataverse | Standard | Allowed | Allowed | Allowed |
| Microsoft Teams | Standard | Allowed | Allowed | Allowed |
| HTTP | HTTP | Allowed | Restricted | Blocked |

Notes: All three transportation custom connectors must be approved before Test/UAT because the staging telematics and fuel card APIs are rate-limited and may incur costs. HTTP connector use in Dev must be limited to read-only GET requests against mocked or public test endpoints -- no write operations via HTTP in any environment.

## Custom Connector Approval Process

Before a custom connector may be used in Test/UAT or Production, it must complete the following approval steps.

| Step | Activity | Owner | Required For |
|------|----------|-------|-------------|
| 1 | Submit connector definition (swagger/OpenAPI spec) to IT Security | Agent builder | Test/UAT and Production |
| 2 | Security review: authentication scheme, data scope, rate limiting, error handling | Security Reviewer | Test/UAT and Production |
| 3 | Legal/compliance review if external data leaves tenant boundary | Compliance Officer | Production only (if applicable) |
| 4 | Assign connector to Business data group in DLP policy | Power Platform Admin | Test/UAT and Production |
| 5 | Document connector in agent runbook.md under Prerequisites | Agent builder | Test/UAT and Production |

## DLP Policy Administration

### Policy Scope
- Apply DLP policies at the environment level, not tenant-wide, to allow different policies per tier.
- If a tenant-wide policy exists, environment-level policies are additive -- the most restrictive rule applies.
- Review DLP policies when a new vertical or new custom connector is introduced.

### Policy Review Cadence
- Monthly: audit DLP violation reports in the Power Platform Admin Center for all environments.
- Quarterly: review whether any temporary restrictions (for example, a restricted HTTP connector pending custom connector approval) should be resolved or escalated.
- On every new connector introduction: update the relevant per-vertical table in this document and submit for IT Security review.

### Enforcement and Violation Handling
- DLP violations are surfaced in the Power Platform Admin Center under the Data Policies > Violations report.
- A violation in Production is treated as a P1 incident: the connector is disabled immediately and a root-cause analysis is completed.
- A violation in Test/UAT triggers a block on the Dev-to-Test/UAT promotion gate until the connector is either approved or removed.
- Violations in Dev are logged but do not block promotions -- they are reviewed monthly as part of the DLP audit.

## Related Documents
- `docs/strategy/environment-topology.md` -- environment tiers, access model, and naming.
- `docs/strategy/promotion-pipeline.md` -- promotion gate requirements including security review.
- `docs/admin-governance.md` -- DLP best practices and audit log retention.
