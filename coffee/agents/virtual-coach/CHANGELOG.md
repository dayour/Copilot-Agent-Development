# Changelog

All notable changes to the Virtual Coach agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-03-03

### Added

- `templates/sharepoint-search-config.yaml` with full SharePoint search optimization:
  - Six custom result sources scoped to Virtual Coach content libraries.
  - Eight managed property mappings (DrinkCategory, PolicyType, StoreRegion, JobRole, ApprovalStatus, LastApprovedDate, ContentOwner, SeasonalFlag).
  - Four search schema refiners (DrinkCategory, PolicyType, StoreRegion, JobRole).
  - Five custom search verticals (Recipes, Policies, Training, Operations, Seasonal Menu).
  - Relevance ranking with freshness boost on LastApprovedDate and metadata completeness boost.
  - Three promoted results for high-frequency operational queries.
  - Twenty-five search query coverage test cases mapped to all agent topic trigger phrases.
  - Continuous crawl enabled on all five libraries with 15-minute incremental and weekly full crawl schedule.
  - Eight generative answer validation criteria with citation rate and hallucination thresholds.

### Changed

- `solution/solution-definition.yaml`: added `search_configuration` block referencing the new config file.
- `runbook.md`: expanded Step 3 into six detailed sub-steps (3a through 3f) covering managed property mapping, result sources, refiners, verticals, relevance ranking, and crawl schedule. Extended post-deployment validation checklist.

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
