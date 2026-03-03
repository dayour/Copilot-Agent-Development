# Changelog

All notable changes to the Power Analysis agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [2.3.0] - 2026-03-03

### Added

- Advanced analytics pipeline flows with full Power Automate specifications in
  `solution/solution-definition.yaml` and documented in `docs/analytics-pipelines.md`.
- **MultiMeasureQuery flow**: Parallel DAX query fan-out across multiple measures
  with configurable input schema (measures array, filters, grouping dimensions),
  concurrency limit of 10, left-outer-join merge strategy, and partial failure handling.
- **TrendAnalysis flow**: Rolling averages (7-day, 28-day, 52-week), WoW/MoM/YoY
  period-over-period growth rates, additive seasonal decomposition, and bootstrap
  confidence intervals. Long-window requests (396+ days) routed to Synapse.
- **AnomalyDetection flow**: Daily scheduled flow (06:30 UTC) performing z-score
  outlier detection across five KPIs for all active stores. Classifies anomalies as
  positive (overperformance) or negative (underperformance) with four severity bands.
  Writes results to the new AnomalyAlerts Dataverse table and notifies the analytics
  Teams channel for high and critical severity anomalies.
- **WhatIfScenario flow**: Elasticity-based revenue and margin projection accepting
  price change %, promotional discount %, and stock increase % parameters. Uses
  historical elasticity data over the configurable ElasticityDataLookbackDays window.
  Returns a scenario comparison table with baseline, projected, and delta values.
- **CrossDomainCorrelation flow**: Pearson correlation of sales data against weather
  (temperature, precipitation, extreme events), local events calendar (event count,
  attendance, public holidays), and social media sentiment (brand mentions, trending
  topics). Includes lag analysis up to 7 days for leading indicator detection.
- **AnomalyAlerts Dataverse table**: Stores anomaly records with StoreId, RegionCode,
  MetricName, MetricValue, RegionalMean, RegionalStdDev, ZScore, AnomalyType, Severity,
  DetectionPeriod, Status (new/acknowledged/resolved), and lifecycle tracking columns.
- New custom connectors: WeatherConnector, EventsCalendarConnector, SocialMediaConnector.
- New environment variables: WeatherApiBaseUrl, WeatherApiKey, EventsCalendarApiBaseUrl,
  EventsCalendarApiKey, SocialMediaApiBaseUrl, SocialMediaApiKey,
  AnomalyDetectionStdDevThreshold, CorrelationSignificanceLevel,
  ElasticityDataLookbackDays, TrendAnalysisConfidenceLevel.
- AnomalyDetection pipeline added to `pipeline_monitoring` section with 08:00 UTC SLA.



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
