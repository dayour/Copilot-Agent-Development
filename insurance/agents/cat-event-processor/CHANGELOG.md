# Changelog

All notable changes to the CAT Event Processor agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-03-03

### Added

- Initial release of the CAT Event Processor agent for bulk claims processing during catastrophe events.
- CAT Event Declaration topic with supervisor approval gate and pre-approved vendor list activation.
- Bulk FNOL intake topic with streamlined minimum-viable-field mode for high-volume ingestion.
- CAT Dashboard topic providing real-time claim volume, geographic distribution, aggregate exposure, and adjuster deployment status.
- Automated triage topic classifying CAT claims by severity (total loss, major damage, minor damage) and routing to appropriate handling tracks.
- Policyholder Proactive Outreach Power Automate flow identifying policyholders in affected geographies and dispatching check-in messages.
- CAT Event Deactivation topic restoring standard SLA controls and generating post-event summary.
- Dataverse tables: CatEvents, CatClaimRecords, CatTriageResults, AffectedPolicyholdersOutreach, CatVendorDirectory.
- Power Automate flows: DeclareCatEvent, ProcessBulkFNOL, GetCatDashboard, TriageCatClaim, SendPolicyholderOutreach, DeactivateCatEvent.
- Dual-channel deployment: internal Teams channel for handlers and supervisors, with optional external policyholder portal integration.
