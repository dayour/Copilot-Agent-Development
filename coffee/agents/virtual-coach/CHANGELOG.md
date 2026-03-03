# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- SharePoint site pages for agent embedding and self-service (`sharepoint-pages/`).
- Store Dashboard page with daily operations summary, shift handover viewer, and embedded Virtual Coach.
- New Hire Onboarding Hub page with step-by-step checklist, training library integration, and embedded Virtual Coach.
- Recipe Reference Center page with searchable recipe catalog, seasonal highlights, and embedded Virtual Coach.
- Manager Portal page with shift management, performance tracking, reporting dashboard, and embedded Virtual Coach.
- SPFx web part definitions for all custom components (`spfx-web-parts.yaml`).
- Azure AD security group permission configuration for all pages and libraries (`page-permissions.yaml`).
- Responsive layout support: two-column desktop, single-column stacked for tablet and mobile (breakpoint 1024 px).

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
