# Changelog

All notable changes to the Claims Assistant agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-03-03

### Changed

- Replaced invented YAML schema with realistic Copilot Studio code-first artifacts (.mcs.yml format).
- Agent definition now uses `agent.mcs.yml` with GenerativeAIRecognizer and integrated auth.
- Agent instructions and persona moved to `settings.mcs.yml` with GptComponentMetadata schema.
- Topics rewritten as AdaptiveDialog YAML with real node kinds (Question, ConditionGroup, InvokeFlowAction, SendActivity).
- Power Automate integrations defined as TaskDialog action files with InvokeFlowTaskAction.
- Knowledge sources defined as KnowledgeSourceConfiguration files.
- Environment variables and connection references moved to `deployment/deployment-settings.json` (PAC CLI format).

### Removed

- Deleted `solution/solution-definition.yaml` (fictional schema).
- Deleted `templates/agent-template.yaml` (fictional schema).
- Removed invented properties: `audience`, `visibility: internal_only`, `trigger: copilot_studio_topic_action`.

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
