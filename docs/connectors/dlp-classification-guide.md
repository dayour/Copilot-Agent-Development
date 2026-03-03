# DLP Classification Guide for Custom Connectors

## Overview

Data Loss Prevention (DLP) policies in Power Platform control which connectors can exchange data with each other within a single flow or app. Correct DLP classification is a critical governance control that prevents unintentional data exfiltration and enforces data residency requirements across the five verticals.

This guide provides classification recommendations for all connectors used in this repository, guidance on policy scope and environment boundaries, and instructions for applying and testing DLP policies.

## DLP Classification Categories

| Category | Definition | Example Connectors |
|---|---|---|
| Business | Connectors that access organizational, confidential, or regulated data | Dataverse, SharePoint, ERP APIs, claims systems, POS APIs |
| Non-Business | Connectors that access public or non-organizational data | Public open data APIs, weather services, no-auth reference data |
| Blocked | Connectors that are prohibited from use in this environment | Consumer social media, personal storage, unapproved external services |

Business and Non-Business connectors cannot be used together in the same flow. This boundary enforces a data isolation perimeter between organizational data and external or personal data services.

## Connector Classification by Vertical

### Cross-Vertical Standard Connectors

| Connector | Classification | Justification |
|---|---|---|
| Microsoft Teams | Business | Organizational communication. Contains internal content and user identities. |
| SharePoint Online | Business | Primary knowledge store. Contains documents, metadata, and business content. |
| Office 365 Outlook | Business | Organizational email. Contains PII and internal business communications. |
| Microsoft Dataverse | Business | Operational data store. Contains records, transactions, and agent telemetry. |
| Azure Active Directory | Business | Identity data. Contains user and group membership information. |
| Power BI | Business | Analytics data. Contains aggregated business metrics and financial indicators. |
| HTTP (Generic) | Business (default) | Assessed per use. Downgrade to Non-Business only if the target is a verified public endpoint returning no organizational data. |
| AI Builder | Business | Model outputs derived from organizational content. |

### Coffee Vertical

| Connector | Classification | Justification |
|---|---|---|
| SharePoint Online (Coffee) | Business | Product guides, training materials, shift notes with operational content. |
| Custom POS API (Coffee) | Business | Transaction records, loyalty account data, store sales figures. |

### Clothing Vertical

| Connector | Classification | Justification |
|---|---|---|
| ERP Integration (Clothing) | Business | Inventory valuations, purchase costs, supplier financials. Confidential. |
| POS Integration (Clothing) | Business | Retail transaction records, product pricing, customer order data. |
| Power BI (Clothing) | Business | Sales and inventory analytics. Aggregated from Business-classified sources. |

### Insurance Vertical

| Connector | Classification | Justification |
|---|---|---|
| Claims Management System | Business | PII, health information, financial claims records. Legally sensitive. |
| Actuarial System | Business | Proprietary risk models, reserve calculations, premium indications. |
| Compliance Rules API | Business | Regulatory compliance data. Potential audit implications. |

### Tech Vertical

| Connector | Classification | Justification |
|---|---|---|
| ServiceNow / Ticketing | Business | Incident records, user data, internal IT infrastructure details. |
| Azure Data Explorer | Business | Operational telemetry, security logs, application performance data. |
| Microsoft Graph | Business | User, group, and organizational identity data. |
| Salesforce CRM | Business | Lead, opportunity, contact, and account data. May include PII. |

### Transportation Vertical

| Connector | Classification | Justification |
|---|---|---|
| Fleet GPS / Telematics | Business | Driver location, HOS records, and vehicle telemetry. Privacy-sensitive. |
| Fuel Card API | Business | Financial transaction records, card holder information. |
| Routing API | Business | Route data derived from internal dispatch and fleet operations. |
| Fuel Price API | Non-Business | Public market fuel price data with no organizational or PII content. |

## Environment Policy Recommendations

### Production Environments

Apply a strict Business Data Only policy to all production environments. This policy:

- Allows Business connectors to share data with other Business connectors.
- Blocks Non-Business connectors from sharing data with Business connectors.
- Blocks all connectors classified as Blocked.

```yaml
dlpPolicy:
  name: Production Business Data Only
  scope: environment
  defaultClassification: Blocked
  groups:
    business:
      connectors:
        - Microsoft Teams
        - SharePoint Online
        - Office 365 Outlook
        - Microsoft Dataverse
        - Azure Active Directory
        - Power BI
        - AI Builder
        - custom_coffee_pos
        - custom_clothing_erp
        - custom_clothing_pos
        - custom_insurance_claims
        - custom_insurance_actuarial
        - custom_tech_servicenow
        - custom_tech_adx
        - custom_tech_salesforce
        - custom_transport_gps
        - custom_transport_fuelcard
        - custom_transport_routing
    nonBusiness:
      connectors:
        - custom_fuel_price_api
    blocked:
      connectors:
        - Facebook
        - Twitter
        - Dropbox
        - OneDrive Personal
        - Gmail
```

### Development and Test Environments

Apply a relaxed policy for development and test environments that allows testing with non-production data. Do not allow any production secrets or real PII in non-production environments.

### Tenant-Level Default Policy

Apply a tenant-level default policy that blocks all connectors not explicitly classified. This policy acts as a safety net for environments that do not have an explicit environment policy assigned.

## Special Classification Cases

### HTTP Connector

The HTTP (Generic) connector must be classified as Business when used to call any organizational API, even if it is a one-off integration. Classify as Non-Business only when all of the following conditions are true:

- The target URL is a publicly documented open API.
- The response data contains no PII, financial records, or internal business content.
- The request does not pass any organizational credentials or bearer tokens.

### Custom Connectors with Mixed Data

If a custom connector endpoint returns a mix of public and organizational data, classify the entire connector as Business. DLP policy is applied at the connector level, not at the operation level.

### AI Builder

AI Builder connectors are always classified as Business because their models are trained on or interact with organizational content. This applies even when the model type is a generic prediction or classification model.

## DLP Policy Testing

### Before Deploying to Production

1. Create a test flow that uses the new connector alongside an existing Business connector.
2. Confirm the flow runs successfully under the target DLP policy.
3. Create a test flow that pairs the new connector with a Blocked connector.
4. Confirm the flow is blocked by DLP policy before it can run.
5. Document the test results in the connector certification checklist.

### DLP Policy Violation Response

When a DLP violation is detected in a production environment:

1. Identify the flow and connectors involved from the Power Platform Admin Center DLP audit log.
2. Determine if the violation is a misconfiguration or a policy gap.
3. Suspend the flow if it is actively violating policy.
4. Reclassify the connector or update the flow design to comply.
5. Re-enable the flow after validation.

## DLP Governance Contacts

| Role | Responsibility |
|---|---|
| Platform Engineering | DLP policy creation and environment assignment |
| Security Architecture | Classification reviews and Blocked list management |
| Compliance | Regulatory requirement mapping for Insurance and Transportation data |
| Vertical Leads | Connector usage review and classification requests |

## Connector Classification Request Process

To add a new connector to a DLP policy group:

1. Submit a classification request to the Platform Engineering team.
2. Provide the connector name, API host, data types returned, and authentication pattern.
3. Security Architecture reviews and approves or escalates to Compliance.
4. Platform Engineering updates the DLP policy in all affected environments.
5. Requester validates the connector functions correctly under the updated policy.
6. Update this document with the new connector entry.

## Related Documents

- `docs/connectors/auth-patterns.md` - Authentication patterns for each connector type
- `docs/connectors/certification-checklist.md` - Connector certification controls
- `docs/connectors/troubleshooting.md` - Troubleshooting guide for connector issues
- `docs/connectors/health-monitoring.md` - Connector health monitoring solution
- `docs/authentication.md` - Agent authentication architecture
