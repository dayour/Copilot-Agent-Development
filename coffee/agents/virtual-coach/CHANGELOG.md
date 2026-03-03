# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- RecipeApprovalFlow: Power Automate flow triggered by SharePoint file changes in `recipes-library`. Routes approval to Training Lead, promotes to major version on approval, auto-refreshes Copilot Studio knowledge source, and notifies the Copilot Studio admin on bulk changes.
- PolicyUpdateFlow: Two-step approval flow for `hr-policy-library`. Legal reviews first, Compliance signs off second. Auto-refreshes knowledge source on dual approval. Notifies admin on bulk changes.
- TrainingMaterialFlow: Approval flow for `training-library`. Regional Manager approves, content is tagged with JobRole and StoreRegion metadata for role-based delivery, and knowledge source is refreshed. Notifies admin on bulk changes.
- Version history tracking via SharePoint major/minor versioning enabled on all three content approval libraries.
- Bulk change notification: when five or more content items change approval status within 60 minutes, the Copilot Studio admin receives an email to trigger manual knowledge source validation.
- New environment variables: `TrainingLeadEmail`, `LegalTeamEmail`, `ComplianceTeamEmail`, `RegionalManagerEmail`, `CopilotStudioAdminEmail`, `BulkChangeThreshold`.
- `workflows/content-approval-workflows.md` documenting the full approval lifecycle for all three flows.

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
