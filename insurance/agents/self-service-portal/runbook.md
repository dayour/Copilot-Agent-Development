# Runbook — Self-Service Portal (Insurance Customer Portal)

## Overview

This runbook covers deployment, configuration, validation, and operations for the Self-Service Portal agent. All policyholder interactions require Azure AD B2C authentication. The portal surfaces claim status, documents, payment history, policy summaries, and communication preferences without requiring contact-center intervention.

## Prerequisites

### Platform and licensing

| Requirement | Details |
|-------------|---------|
| Copilot Studio license | Per-tenant or per-user licensing approved by platform governance |
| Power Platform environment | Production Dataverse environment in approved geography |
| Power Automate | Required for API orchestration and data writes |
| Azure AD B2C | External customer identity; mandatory for all portal sessions |
| Azure Communication Services | Required for SMS and email notification dispatch |

### Integration dependencies

| Integration | Requirement |
|------------|-------------|
| Claims management API | Guidewire ClaimCenter or Duck Creek endpoint, OAuth2 client credentials, claim status and document index endpoints |
| Document storage | Enterprise document repository with malware scanning, versioning, and immutable audit metadata |
| OCR processing | AI Builder document processing model or Azure Document Intelligence endpoint for police reports, medical bills, and repair estimates |
| Payment gateway API | Claim payment history endpoint and upcoming disbursement endpoint with claim ID lookup |
| Policy administration API | Policy detail endpoint returning coverage limits, deductibles, and effective dates by policy number |
| Dataverse customer profile | Table for storing and retrieving policyholder communication preferences |
| Azure Communication Services | SMS and email delivery endpoint with template support |

### Security and operations prerequisites

| Requirement | Details |
|-------------|---------|
| Azure AD B2C tenant | Tenant provisioned with sign-in/sign-up user flow and claims-portal application registration |
| DLP policy | Connector grouping and exfiltration controls approved by security governance |
| Key management | Secrets in environment variables or Azure Key Vault via secure connection references |
| Audit | Dataverse auditing enabled for customer profile and preference tables |
| Logging | Conversation transcript export and operational telemetry pipeline configured |

---

## Deployment Steps

### 1. Provision environment

1. Open <https://copilotstudio.microsoft.com>.
2. Select the target production Dataverse environment.
3. Confirm data residency, retention policy, and legal hold requirements with compliance.

### 2. Configure Azure AD B2C

1. Register the customer portal application in the Azure AD B2C tenant.
2. Create or confirm the sign-in/sign-up combined user flow.
3. Add custom claims to the user flow token: `policyholder_id`, `email`, `phone`.
4. Set the Copilot Studio web channel redirect URI in the B2C application registration.
5. Validate token issuance with a test B2C account before proceeding.

### 3. Import solution package

1. Go to **Solutions** and import `solution/solution-definition.yaml`.
2. Map environment variables for all API endpoints, B2C configuration, and communication services.
3. Validate connection references and credentials.
4. Confirm all solution components import with healthy status.

### 4. Configure portal integrations

1. Configure the claims management connector and test status retrieval with a known claim ID.
2. Configure the document storage connector with upload and read permissions.
3. Configure the OCR model (AI Builder or Azure Document Intelligence) and validate extraction on sample documents.
4. Configure the payment gateway connector and test with known payment records.
5. Configure the policy administration connector and test coverage summary retrieval.
6. Configure the Azure Communication Services connector for SMS and email delivery.

### 5. Configure Dataverse customer profile table

1. Confirm the `CustomerProfile` table is present with required columns:
   - `PolicyholderId`
   - `PreferredChannel` (email, sms, teams)
   - `EmailAddress`
   - `PhoneNumber`
   - `TeamsUpn`
   - `NotificationsEnabled`
   - `LastUpdatedOn`
2. Apply field-level security to restrict access to PII columns.
3. Enable Dataverse auditing on the table.

### 6. Configure the web channel and embed

1. In Copilot Studio, publish the agent to the custom website channel.
2. Set the channel authentication to Azure AD B2C with the application registration configured in step 2.
3. Set `allow_unauthenticated: false` to enforce mandatory sign-in.
4. Copy the webchat embed snippet and integrate it into the customer portal page.
5. Confirm the embed loads and triggers the B2C sign-in flow correctly.

### 7. Publish

1. Publish the agent to the custom website channel.
2. Run post-publish smoke tests for all five portal components using test accounts.

---

## Post-Deployment Validation Checklist

### Authentication

- [ ] Unauthenticated access to the portal agent is blocked.
- [ ] B2C sign-in redirects correctly and returns a valid token.
- [ ] Policyholder identity (`policyholder_id`, `email`) is bound to the session after sign-in.

### Claim Status Portal

- [ ] Authenticated policyholder can retrieve status for their own claims by claim number.
- [ ] Claim documents linked to the claim are listed and accessible.
- [ ] Adjuster messaging routes securely to the assigned adjuster queue.
- [ ] Policyholder cannot access claims not associated with their policy.

### Document Upload Portal

- [ ] File upload accepts PDF, JPG, and PNG within the size limit.
- [ ] Malware scan is executed before the document is stored.
- [ ] OCR extraction runs for police reports, medical bills, and repair estimates.
- [ ] Extracted fields are attached to the claim record.
- [ ] Non-OCR document types are stored and linked without extraction.

### Payment Status

- [ ] Payment history displays for authenticated claims.
- [ ] Upcoming payment amount and expected date are shown where available.
- [ ] Payment method on file is displayed in masked form (last four digits only).
- [ ] Payment method update request is escalated; agent does not modify payment data directly.

### Policy Summary

- [ ] Plain-language policy summary is returned for the authenticated policyholder's policies.
- [ ] Coverage limits and deductibles are accurate and policy-specific.
- [ ] Summary is scoped to the authenticated customer; other customers' data is not accessible.

### Communication Preferences

- [ ] Policyholder can view current notification preferences.
- [ ] Preference updates for email, SMS, and Teams are written to the customer profile.
- [ ] Confirmation is shown after a preference change.
- [ ] Opt-out of all notifications is honored and recorded.

### Security and privacy

- [ ] PII fields are masked in conversation logs.
- [ ] Session data is not persisted beyond the configured retention period.
- [ ] Right-to-erasure workflow can remove customer profile and preference data.
- [ ] No cross-customer data leakage in any portal component.

---

## Data Privacy and Records Management

| Control Area | Requirement |
|-------------|-------------|
| PII handling | Limit collection to authenticated identity fields required for portal functionality |
| Payment data | Display masked payment method only; route updates out-of-band |
| Log retention | Store transcripts and telemetry per regulatory and corporate retention policy |
| Right to erasure | Execute approved deletion workflow for customer profile and preferences |
| Purpose limitation | Use collected data solely for portal self-service and notification delivery |
| Access control | Enforce least privilege; portal agent accesses only data scoped to the authenticated policyholder |

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Authentication failure rate review | Daily | IAM Team |
| OCR extraction quality review | Weekly | Claims Intake Product Owner |
| Payment API availability check | Continuous + daily review | Platform Engineering |
| Policy API response accuracy spot-check | Weekly | Product Owner |
| Communication preference delivery failures | Daily | Platform Engineering |
| PII and access control review | Quarterly | Security Governance Team |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|---------------|------------|
| B2C authentication failure | IAM Team | Security Operations |
| Claims API outage | Platform Engineering | Vendor and Incident Commander |
| OCR extraction failures | Platform Engineering | AI Builder or Document Intelligence support |
| Payment API outage | Platform Engineering | Payment vendor and Incident Commander |
| PII incident or privacy request breach | DPO | CISO and Legal |

---

## Rollback Procedure

1. Unpublish the current agent version from the web channel.
2. Re-import the previous signed solution artifact from the release repository.
3. Rebind production connection references and environment variables.
4. Re-run smoke tests for all five portal components.
5. Notify claims operations, product, and compliance teams.
