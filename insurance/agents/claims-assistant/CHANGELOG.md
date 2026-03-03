# Changelog

All notable changes to the Claims Assistant agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-03-03

### Added

- Actuarial and reserving system integration via custom Power Platform connector (`connectors/actuarial-system-connector.yaml`) with OAuth 2.0 client credentials authentication.
- Reserve Estimation: FNOL topic now calls the actuarial API to calculate a suggested initial reserve based on claim type, severity indicators, and historical loss data. Result is stored in the new `ActuarialReserveEstimates` Dataverse table for adjuster review.
- IBNR and Loss Development topic: handler and actuary topic to query current incurred-but-not-reported reserve estimates for any reporting period and line of business, including confidence intervals and development method.
- Claims Trend Analysis topic: handler topic surfacing claims frequency, severity, and loss ratio trend data by line of business and geographic region over a configurable trailing period.
- Peer Claim Comparison topic: handler topic comparing a specific claim's reserve and open duration against historical peer claims, returning reserve adequacy and timeline percentile rankings.
- Two new Dataverse tables: `ActuarialReserveEstimates` and `LossDevelopmentData`.
- Four new Power Automate flows: `EstimateInitialReserve`, `GetIbnrEstimate`, `GetClaimsTrendAnalysis`, `GetPeerClaimComparison`.
- Four new environment variables for the actuarial system API: `ActuarialApiBaseUrl`, `ActuarialApiTokenUrl`, `ActuarialApiClientId`, `ActuarialApiClientSecret`.
- Two new global agent variables: `initial_reserve_amount`, `reserve_confidence_level`.

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
