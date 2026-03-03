# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- Shift Schedule SharePoint list with columns Store, Date, Shift, Employee, Role, Status and color-coded list formatting.
- Handover Log SharePoint list with columns Store, Date, FromEmployee, ToEmployee, CashBalanced, StockChecked, Issues, Timestamp; replaces previous shift-handover-list.
- Equipment Inventory SharePoint list with columns Store, Item, SerialNumber, LastMaintenance, NextService, Status and color-coded list formatting.
- Store Contact Directory SharePoint list with columns Store, Manager, RegionalDirector, Phone, Email; replaces previous store-directory-list.
- Four new Power Automate flows: QueryShiftSchedule, SaveHandoverLog, QueryEquipmentInventory, QueryStoreContactDirectory.
- Shift Schedule topic in the agent template for querying shift assignments by store and date.
- Equipment Inventory topic in the agent template for querying equipment status and service records by store.
- List formatting definitions for visual status indicators on Status columns across Shift Schedule and Equipment Inventory lists.

### Changed

- Shift Handover topic updated to write to handover-log-list with the new Handover Log schema (FromEmployee, ToEmployee, Timestamp).
- Store Lookup topic updated to query store-contact-directory-list with the new Store Contact Directory schema (Manager, RegionalDirector, Phone, Email).
- Environment variables updated to reference the four new list URLs in place of the previous ShiftHandoverListUrl and StoreDirectoryListUrl.
- Greeting quick replies expanded to include Shift schedule, Equipment status, and Store contacts.

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
