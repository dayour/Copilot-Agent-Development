# Runbook — Claims Assistant (Enterprise P&C)

## Overview

This runbook defines deployment, compliance configuration, validation, and operations for the enterprise Claims Assistant serving auto, property, and casualty lines. The runbook assumes high-volume intake operations and state-by-state compliance obligations.

## Prerequisites

### Platform and licensing

| Requirement | Details |
|-------------|---------|
| Copilot Studio license | Per-tenant or per-user licensing approved by platform governance |
| Power Platform environment | Production Dataverse environment in approved geography |
| Power Automate | Required for API orchestration and compliance checks |
| Microsoft 365 + Teams | Required for internal handler deployment |
| Azure AD + Azure AD B2C | Internal workforce identity and external policyholder identity |

### Integration dependencies

| Integration | Requirement |
|------------|-------------|
| Claims management API | Guidewire ClaimCenter or Duck Creek API endpoint, OAuth2 client credentials, non-production and production base URLs |
| Document storage | Enterprise document repository with malware scanning and immutable audit metadata |
| Payment gateway/API | Claim payment status endpoint with claim ID lookup and disbursement status fields |
| OCR processing | AI Builder model configured for police reports and repair estimates |
| Optional valuation | CCC ONE or Mitchell connector/API for estimate context |

### Security and operations prerequisites

| Requirement | Details |
|-------------|---------|
| DLP policy | Connector grouping and exfiltration controls approved by security governance |
| Key management | Secrets in environment variables or secure connection references |
| Audit | Dataverse auditing enabled for compliance-related tables |
| Logging | Conversation transcript export and operational telemetry pipeline |

---

## Deployment Steps

### 1. Provision environment
1. Open <https://copilotstudio.microsoft.com>.
2. Select the target production Dataverse environment.
3. Confirm data residency, retention, and legal hold requirements with compliance.

### 2. Import solution package
1. Go to **Solutions** and import `solution/solution-definition.yaml`.
2. Map environment variables for claims API, document storage, payment, and routing.
3. Validate connection references and credentials.
4. Confirm all solution components import with healthy status.

### 3. Configure claims integrations
1. Configure claims management connector (Guidewire or Duck Creek).
2. Configure document repository connector and upload permissions.
3. Configure payment status connector and test with known claim IDs.
4. Confirm OCR action can process sample police reports and estimates.

### 4. Load state regulatory compliance rules
1. Populate Dataverse table `StateComplianceRules` with one row per state and line of business.
2. Include required fields:
   - `StateCode`
   - `LineOfBusiness`
   - `AcknowledgementDueDays`
   - `PaymentDueDaysFromProof`
   - `RequiredFraudDisclosureText`
   - `RightToAppraisalDisclosureText`
   - `AdditionalMandatoryDisclosures`
   - `DocumentationRequirements`
   - `EscalationThresholdHours`
   - `EffectiveDate`
3. Validate table integrity with mandatory-field and duplicate-key checks.
4. Publish and smoke-test disclosure rendering in FNOL.

### 5. Configure fraud signal collection
1. Enable Dataverse table `FraudSignals`.
2. Configure flow `CalculateFraudScore` to populate:
   - report delay (incident-to-report delta)
   - description/damage inconsistency indicator
   - prior claim count in lookback window
   - geographic anomaly score
3. Mark fraud fields as internal-only (not displayed to policyholder).
4. Verify escalation logic on high-risk threshold.

### 6. Configure SLA monitoring
1. Enable Dataverse table `SlaTracking`.
2. Configure flow `CheckSlaCompliance` to compute:
   - acknowledgment due timestamp
   - proof-of-loss payment due timestamp
   - current SLA state (OnTrack, AtRisk, Breach)
3. Schedule monitoring flow at 15-minute interval.
4. Publish Teams notifications for handler queues nearing breach.

### 7. Configure compliance audit trail
1. Enable Dataverse table `ComplianceLog`.
2. Ensure Dataverse auditing is active for the `ComplianceLog` table.
3. Confirm that the `LogComplianceEvent` flow is enabled and writing records that include:
   - `ClaimReference`
   - `ConversationId`
   - `EventType` (disclosure_delivered, appraisal_disclosure_delivered, fnol_submitted, data_access_request, data_erasure_request)
   - `DisclosureText`
   - `CustomerAcknowledged`
   - `AcknowledgedOn`
   - `HandlerUserId`
   - `Timestamp`
4. Run a test FNOL conversation and verify that two disclosure records and one FNOL submission record appear in `ComplianceLog`.

### 8. Configure regulatory report export
1. Set the `RegulatoryReportStorageUrl` environment variable to the approved storage destination for state insurance department submissions.
2. Set the `ComplianceReportRecipientEmail` environment variable to the compliance officer distribution list.
3. Enable the `RegulatoryReportExport` flow, which runs weekly and exports claims and compliance audit data in state-required formats.
4. Confirm test export runs successfully and the notification email is received.

### 9. Configure PII redaction
1. Set `PiiRedactionEnabled` environment variable to `true` for all production environments.
2. Confirm the `RedactConversationLog` flow is enabled and applies redaction to PII fields in conversation log exports before long-term storage.
3. Validate that `PiiDataClassification` is populated on `ClaimRecords` rows and that redaction honours classification levels.
4. Review field-level security on the `ComplianceLog` and `ClaimRecords` tables to enforce least privilege for each role.

### 10. Configure authentication and channels
1. External channel: configure Azure AD B2C for policyholder web portal access.
2. Internal channel: configure Azure AD tenant restriction for Teams handlers.
3. Validate role-based access for handler-only topics (SLA status, CAT mode).

### 11. Publish
1. Publish to custom website channel for policyholder intake.
2. Publish to Teams for claims handlers and supervisors.
3. Run post-publish smoke tests in both channels.

---

## Post-Deployment Validation Checklist

### Core functional validation
- [ ] FNOL collects line-specific intake fields for auto, property, and casualty.
- [ ] Claims API creates claim record and returns a valid claim number.
- [ ] Claim status returns status, adjuster contact, payment status, and next steps.
- [ ] Document upload works and OCR extracts structured fields.
- [ ] Escalation passes full context to human handler.

### Regulatory and compliance validation
- [ ] State-required fraud disclosure text is rendered for all supported states.
- [ ] Right-to-appraisal disclosure text is rendered and customer acknowledgment is captured.
- [ ] Documentation requirements are returned from `StateComplianceRules` for each state and line.
- [ ] Acknowledgment SLA is computed correctly by state rule.
- [ ] Payment SLA is computed correctly after proof-of-loss received event.
- [ ] Handler SLA dashboard identifies AtRisk and Breach claims.
- [ ] Coverage denial intent is blocked from agent completion and escalated to human workflow.
- [ ] Every FNOL submission writes disclosure and FNOL-submitted records to `ComplianceLog`.
- [ ] Required Disclosures topic writes acknowledgment records to `ComplianceLog`.
- [ ] Regulatory report export runs on schedule and delivers output to the configured storage location.

### Security and privacy validation
- [ ] PII fields are masked in logs where required.
- [ ] `RedactConversationLog` flow applies PII redaction before long-term storage when `PiiRedactionEnabled` is true.
- [ ] `PiiDataClassification` is set correctly on all new `ClaimRecords` rows.
- [ ] Data Subject Request topic processes access requests and returns a PII summary.
- [ ] Data Subject Request topic submits erasure requests and logs the event to `ComplianceLog`.
- [ ] Conversation transcripts follow configured retention period.
- [ ] Right-to-erasure workflow removes eligible personal data from operational stores.
- [ ] Access to fraud scoring and legal notes is restricted to authorized handler roles.

---

## Data Privacy and Records Management

| Control Area | Requirement |
|-------------|-------------|
| PII handling | Limit collection to minimum necessary claim intake data; apply field-level security where available |
| Log retention | Store transcripts and telemetry per regulatory and corporate retention policy |
| Right to erasure | Execute approved deletion workflow for jurisdictions and scenarios where deletion is legally permitted |
| Purpose limitation | Use collected data solely for claims handling, compliance, and fraud detection |
| Access control | Enforce least privilege for handler, supervisor, compliance, and engineering roles |

---

## Catastrophe Event Mode Activation Procedure

Use this procedure for declared catastrophe events (for example, hurricane, wildfire, hail event).

1. Claims operations lead obtains catastrophe activation approval.
2. In Teams handler channel, invoke topic: `CAT Event Mode`.
3. Provide event metadata:
   - event name
   - affected states/counties
   - effective start timestamp
   - expected intake surge multiplier
4. Flow `ActivateCatMode` updates:
   - CAT mode status flag
   - expedited intake routing rules
   - temporary SLA policy overrides if approved by compliance
5. Validate that FNOL prompts include CAT event reference and emergency guidance language.
6. Notify handlers that auto-assignment thresholds and backlog routing have changed.
7. When event period ends, run CAT deactivation and return to standard SLA controls.

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| SLA breach report review | Daily | Claims Operations Manager |
| Fraud signal trend review | Daily | SIU Lead |
| Compliance rule table review | Monthly or on regulatory change | Compliance Officer |
| API and flow health checks | Continuous + daily review | Platform Engineering |
| OCR extraction quality review | Weekly | Claims Intake Product Owner |
| Access and DLP review | Quarterly | Security Governance Team |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|---------------|------------|
| Claims API outage | Platform Engineering | Vendor and Incident Commander |
| Incorrect compliance timeline | Compliance Officer | Legal and Claims Leadership |
| Fraud scoring anomaly | SIU Lead | Data Science and Risk Governance |
| PII incident or privacy request breach | DPO | CISO and Legal |
| Channel auth failure | IAM Team | Security Operations |

---

## Rollback Procedure

1. Unpublish current agent version.
2. Re-import previous signed solution artifact from release repository.
3. Rebind production connection references and environment variables.
4. Re-run smoke tests for FNOL, status, and escalation.
5. Notify claims operations, compliance, and contact center leadership.
