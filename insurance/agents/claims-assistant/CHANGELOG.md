# Changelog

All notable changes to the Claims Assistant agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-03-03

### Added

- State-specific rules engine enhancements: `StateComplianceRules` table extended with `RightToAppraisalDisclosureText`, `AdditionalMandatoryDisclosures`, and `DocumentationRequirements` columns for per-state, per-line documentation and disclosure requirements.
- Required disclosure delivery: FNOL topic now delivers fraud warning and right-to-independent-appraisal disclosures with explicit customer acknowledgment capture at intake.
- Compliance audit trail: new `ComplianceLog` Dataverse table records every disclosure delivery, customer acknowledgment, FNOL submission, and data subject request with timestamp and conversation ID.
- `LogComplianceEvent` Power Automate flow writes timestamped audit records from FNOL, Required Disclosures, and Data Subject Request topics.
- Regulatory reporting: `RegulatoryReportExport` flow runs on a weekly schedule and exports claims and compliance data in state insurance department required formats.
- Privacy compliance: `RedactConversationLog` flow redacts PII fields from conversation log exports before long-term storage when `PiiRedactionEnabled` is true.
- `PiiDataClassification` column added to `ClaimRecords` table to support field-level data classification and redaction rules.
- New topics: `Required Disclosures` for on-demand delivery of state-mandated disclosures with audit logging, and `Data Subject Request` for GDPR/CCPA access and erasure request handling.
- New environment variables: `RegulatoryReportStorageUrl`, `ComplianceReportRecipientEmail`, `PiiRedactionEnabled`.
- Runbook updated with setup steps for compliance audit trail (step 7), regulatory report export (step 8), and PII redaction (step 9).

### Changed

- `LookupStateDisclosure` action output extended to include `right_to_appraisal_disclosure_text` and `documentation_requirements`.

## [2.0.0] - 2026-03-02

### Added

- Enterprise multi-line P&C support with catastrophe event operations mode.
- Fraud signal collection with composite risk scoring via Dataverse.
- State compliance rule enforcement with SLA monitoring and breach alerting.
- Dual-channel deployment: external policyholder portal (Azure AD B2C) and internal claims handler Teams channel (Azure AD).
- AI Builder OCR model for police report and repair estimate extraction.

### Changed

- Migrated from single-line to multi-line claims architecture.
- Authentication model updated to support dual-audience (B2C + AAD) configuration.

## [1.0.0] - 2025-10-01

### Added

- Initial release of the Claims Assistant agent for the Insurance vertical.
- FNOL intake topic with claim reference generation.
- Basic claim status retrieval via HTTP connector.
