# Changelog

All notable changes to the Self-Service Portal agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-03-03

### Added

- Initial release of the Self-Service Portal agent for the Insurance vertical.
- Claim Status Portal topic with secure adjuster messaging and document list retrieval.
- Document Upload Portal topic with malware scanning, AI Builder OCR, and Azure Document Intelligence support for police reports, medical bills, and repair estimates.
- Payment Status topic displaying payment history, upcoming disbursements, and masked payment method on file.
- Policy Summary topic delivering plain-language coverage limits and deductibles for authenticated policyholders.
- Communication Preferences topic allowing policyholders to set and update notification channels (email, SMS, Teams).
- Mandatory Azure AD B2C authentication on the custom website channel; unauthenticated access blocked.
- Escalation topic passing full portal session context to claims handler.
