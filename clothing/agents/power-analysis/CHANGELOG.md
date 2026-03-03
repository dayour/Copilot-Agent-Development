# Changelog

All notable changes to the Power Analysis agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-03-03

### Added

- Multi-agent orchestration patterns: hub-and-spoke, pipeline, and consensus.
- Hub Routing topic as the central dispatcher for the hub-and-spoke pattern.
- Four specialized spoke topics: Sales Analyst Spoke, Inventory Analyst Spoke, Customer Analyst Spoke, Operations Analyst Spoke.
- Hub and Spoke Synthesis topic to combine spoke results into a unified response.
- Weekly Business Review topic as the entry point for the four-stage pipeline pattern.
- Four pipeline stage topics: Business Review - Data Collection, Business Review - Insight Generation, Business Review - Narrative Construction, Business Review - Delivery.
- Markdown Recommendation topic as the entry point for the consensus pattern.
- Five consensus perspective topics: Consensus - Sales Velocity, Consensus - Inventory Position, Consensus - Margin Analysis, Consensus - Competitive Intelligence, Consensus - Historical Precedent.
- Consensus - Recommendation Synthesis topic with confidence level output.
- Seven global orchestration variables: Orchestration.SessionId, Orchestration.Pattern, Orchestration.SpokeResults, Orchestration.PipelineStage, Orchestration.BusinessReviewPayload, Orchestration.ConsensusRequest, Orchestration.ConsensusResults.
- AgentOrchestrationSessions Dataverse table for full session audit and analytics.
- Eleven new Power Automate flows: OrchestrationSessionCreate, OrchestrationSessionUpdate, SalesAnalystQuery, InventoryAnalystQuery, CustomerAnalystQuery, OperationsAnalystQuery, BusinessReviewDataCollection, BusinessReviewInsightGeneration, BusinessReviewNarrativeConstruction, BusinessReviewDelivery, MarkdownConsensusQuery.
- Four new environment variables: OrchestratorTimeoutSeconds, SpokeFallbackMessage, BusinessReviewTeamsChannelId, BusinessReviewPowerPointTemplateId.
- docs/multi-agent-orchestration.md with full pattern design, context handoff, fallback, and runbook guidance.

## [2.2.0] - 2026-03-03

### Added

- Merge pull request #115 from dayour/copilot/implement-data-sync-pipelines
- fix: resolve merge conflicts after PR #114 merged - keep all content
- fix: resolve merge conflicts - keep data sync pipelines and existing content
- feat: implement batch data sync pipelines for clothing power-analysis agent

## [2.1.0] - 2026-03-03

### Added

- Merge pull request #114 from dayour/copilot/integrate-ai-builder-analytics
- fix: resolve merge conflicts - keep AI Builder and reporting/alerting content
- feat(clothing): integrate AI Builder for advanced analytics capabilities

## [1.0.0] - 2026-03-02

### Added

- Initial release of the Power Analysis agent for the Clothing vertical.
- Power BI integration for sales, inventory, and trend analytics.
- Solution definition with environment variable declarations and channel configuration.
- Agent template with topics for BI report navigation and data insights.
