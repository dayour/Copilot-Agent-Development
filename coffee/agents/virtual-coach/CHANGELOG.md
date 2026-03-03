# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- `document-governance.md` defining multi-store document governance and permissions for a multi-hundred-store deployment.
  - Azure AD security group design (corporate function, regional, store, and ownership tiers).
  - SharePoint hub-site permissions inheritance model with store-level overrides for local content.
  - Sensitivity label taxonomy (Confidential - HR, Confidential - Disciplinary, Confidential - Payroll, Restricted - Legal) with Microsoft Purview configuration guidance.
  - DLP policy definitions for payroll restriction, disciplinary content restriction, and franchise-corporate sharing barrier.
  - Information Barriers configuration for franchise and corporate ownership segments.
  - Agent permission validation matrix and test procedure to validate SharePoint ACL pass-through by role.
- Governance environment variables in `solution-definition.yaml`: `CorporateHubSiteId`, `InformationBarriersEnabled`, `DlpComplianceOfficerEmail`, `SensitivityLabelIdHrConfidential`, `SensitivityLabelIdDisciplinary`, `SensitivityLabelIdPayroll`.
- `governance_controls` section in `solution-definition.yaml` declaring security group tiers, Information Barrier policies, sensitivity label bindings, and DLP policies.
- `permission_trimming: delegated_user_identity` and `sensitivity_label_enforcement: true` on the HR policy library knowledge source.
- `identity_mode: delegated_user` and `service_account_knowledge_retrieval: false` on agent authentication to enforce user-context knowledge retrieval.

### Changed

- `runbook.md` Step 7 expanded with governance configuration pre-requisites and reference to `document-governance.md`.
- `runbook.md` Post-Deployment Validation checklist extended with governance validation items.
- `runbook.md` Monitoring and Operations table extended with governance monitoring cadence.
- `README.md` Quick Start updated to reference `document-governance.md` and added `document-governance.md` to folder structure.

## [1.1.0] - 2026-03-02

### Added

- Seasonal menu library knowledge source with DrinkCategory and StoreRegion metadata filters.
- Shift handover writeback flow integrated with SharePoint list.

### Changed

- Expanded SharePoint knowledge sources to include operations and HR policy libraries.

## [1.0.0] - 2026-01-15

### Added

- Initial release of the Virtual Coach agent for the Coffee vertical.
- SharePoint-centric knowledge sources for recipes, training, and store operations.
- Power Automate flows for shift handover and store directory queries.
- Microsoft Teams and custom website channel configuration.
