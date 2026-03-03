# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- `ExportAnalyticsToDataverse` Power Automate flow reference linking the Virtual Coach solution to the new `CoffeeVirtualCoachAnalytics` analytics dashboard solution.
- Analytics dashboard companion solution at `coffee/agents/analytics-dashboard/` providing SharePoint-hosted Power BI reporting, role-based views, and a natural-language analytics agent.

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
