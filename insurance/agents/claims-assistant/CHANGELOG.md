# Changelog

All notable changes to the Claims Assistant agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

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
