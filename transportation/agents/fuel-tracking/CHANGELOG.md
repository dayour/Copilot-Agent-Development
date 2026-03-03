# Changelog

All notable changes to the Fuel Tracking agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-03-03

### Added

- Custom connector `FuelCardConnector` replacing generic HTTP connector, with named actions: `GetTransactions`, `GetCardDetails`, `GetMerchantInfo`, and `SuspendCard`. Supports WEX, Comdata, and Fleetcor providers.
- `InvestigateFuelTransaction` Power Automate flow: pulls GPS location at time of fill, driver assignment, route history, prior 30-day transaction count, and telematics fuel-level reading for a given transaction.
- `ProactiveAnomalyAlert` Power Automate flow: triggers on new FuelAnomalies record creation and sends a Teams adaptive card to fleet managers for high and critical severity findings. Card includes one-click Investigate, Suspend Card, and Dismiss actions.
- Missing agent-tool flows: `GetFuelSummary`, `GetDriverEfficiencyRanking`, `GetFuelTransactions`, and `GetFuelAnomalies`.
- One-click adaptive card actions (Investigate Top Anomaly, Suspend Associated Card, Dismiss All Low Confidence) to the Anomaly Alert topic.
- Full-context adaptive card with action buttons (Escalate, Suspend Card, Dismiss) to the Anomaly Investigation topic.
- Proactive trigger binding (`ProactiveAnomalyAlert`) on the Anomaly Alert topic.

### Changed

- `IngestFuelTransactions` flow trigger updated from every 5 minutes to hourly. Added per-transaction enrichment steps: vehicle class lookup from VehicleMaster, driver name lookup from DriverMaster, and route correlation from telematics API.
- `DetectAnomalies` flow updated to reference `FuelAnomalyRules` table and to enumerate the five anomaly rule evaluations explicitly: tank capacity overfill, multiple fills in short period, off-route fueling, price above market rate, and after-hours fueling.
- `SuspendFuelCard` flow updated to use the `FuelCardConnector.SuspendCard` named action in place of a raw HTTP POST.
- `AnomalyRules` Dataverse table display name renamed to `FuelAnomalyRules` to match issue specification.
- Anomaly Investigation topic expanded to surface GPS location at fill, driver assignment, route name and ID, prior transaction count, and telematics fuel reading.

## [1.0.0] - 2026-03-02

### Added

- Initial release of the Fuel Tracking agent for the Transportation vertical.
- Fuel consumption logging, cost analysis, and efficiency reporting topics.
- Integration with fleet management system via HTTP connector.
- Teams and custom website channel configuration.
