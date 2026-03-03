# Analytics Pipeline Flows — Power Analysis Agent (Clothing Retail)

## Overview

This document describes the five advanced Power Automate cloud flows that power the deep
reasoning capabilities of the Power Analysis agent. These flows handle multi-measure
querying, anomaly detection, trend analysis, what-if scenario projection, and
cross-domain correlation against external signals.

All flows are registered as components in `solution/solution-definition.yaml` under the
`power_automate_flows` section. Flows that require agent interaction are triggered via
`copilot_studio_topic_action`. The `AnomalyDetection` flow is scheduled to run daily.

---

## Flow Summary

| Flow | Trigger | Description |
|---|---|---|
| MultiMeasureQuery | Topic action | Parallel DAX query fan-out across multiple measures; merges results into unified dataset |
| TrendAnalysis | Topic action | Rolling averages, period-over-period growth, seasonal decomposition with confidence intervals |
| AnomalyDetection | Scheduled daily (06:30 UTC) | Z-score outlier detection across stores; writes to AnomalyAlerts table |
| WhatIfScenario | Topic action | Elasticity-based revenue and margin projection for price, promo, and stock changes |
| CrossDomainCorrelation | Topic action | Pearson correlation between sales and weather, events, and social media signals |

---

## Flow 1: MultiMeasureQuery

### Purpose

Enables the agent to answer multi-metric questions in a single interaction. The caller
provides an array of DAX measure names, optional filters, and grouping dimensions. The
flow fans out parallel Power BI Execute Queries API calls (one per measure group), waits
for all branches, then merges the results into a single unified dataset before returning
structured JSON to the agent topic.

### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| measures | array of string | Yes | DAX measure names to evaluate |
| filters | object | No | Slicer context: StoreId, RegionCode, CategoryCode, BrandName, Channel, StartDate, EndDate |
| grouping_dimensions | array of string | Yes | Dimensions included as rows (e.g., StoreId, WeekKey) |
| period | string | No | Shorthand period when StartDate/EndDate are omitted (CurrentWeek, LastWeek, CurrentMonth, LastMonth, QuarterToDate, YearToDate, Last52Weeks) |

### Execution Logic

1. Validate input: at least one measure and one grouping dimension are required.
2. Fan out parallel branches using Apply to Each (parallel mode, concurrency limit 10).
   Each branch calls the Power BI Execute Queries API with the single measure, filters,
   and dimensions.
3. Wait for all branches to complete.
4. Merge branch results on shared grouping dimension keys using a left outer join.
   Measures with no data for a given dimension key are set to null.
5. Sort merged dataset by the first grouping dimension ascending.
6. Return structured JSON including `query_id`, `executed_at`, `measures_returned`,
   `rows`, `total_row_count`, `data_as_of`, and `errors` (per-measure errors when a
   specific branch fails; partial results are returned).

### Query Patterns Supported

- SalesPerformance
- RCASalesDiagnostics
- RCAInventoryDiagnostics
- RCAStaffingExternal
- InventoryIntelligence

### Error Handling

- Partial failure (one branch fails): return available measures with an `errors` array
  listing the failed measure and error message.
- Full failure: return empty `rows` with an error message.

### Retry Policy

| Parameter | Value |
|---|---|
| Max retries | 3 |
| Initial delay | 10 seconds |
| Backoff multiplier | 2 |
| Max delay | 80 seconds |

---

## Flow 2: TrendAnalysis

### Purpose

Answers time-series questions such as "What is the sales trend for Store 12 over the
last 90 days?" The flow calculates rolling averages (7-day, 28-day, 52-week by default),
period-over-period growth rates (WoW, MoM, YoY), optional seasonal decomposition, and
confidence intervals for all computed series. Requests spanning more than 13 months are
automatically routed to the Azure Synapse workspace to avoid timeout.

### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| metric | string | Yes | DAX measure name to trend |
| filters | object | No | Slicer context |
| analysis_window_days | integer | Yes | Number of days in the trend window |
| rolling_averages | array of integer | No | Rolling-average window sizes in days (default [7, 28, 364]) |
| include_period_over_period | boolean | No | Include WoW, MoM, YoY growth rates (default true) |
| include_seasonal_decomposition | boolean | No | Decompose into trend, seasonal, residual components (default false) |
| confidence_level | decimal | No | Confidence level for intervals (default from TrendAnalysisConfidenceLevel env var) |

### Calculations

**Rolling Averages**
Simple moving average of the metric over the preceding N days for every date in the
result set. Dates with insufficient history are marked null.

**Period-Over-Period Growth**
- WoW: `(current_week_value - prior_week_value) / prior_week_value`
- MoM: `(current_month_value - prior_month_value) / prior_month_value`
- YoY: `(current_period_value - same_period_last_year_value) / same_period_last_year_value`

**Seasonal Decomposition (when requested)**
Additive decomposition with a 364-day season length. Returns trend, seasonal, and
residual component series alongside the original metric.

**Confidence Intervals**
Bootstrap resampling with 1000 iterations applied to rolling averages and
period-over-period growth rates. Upper and lower bounds are included in each row.

### Data Routing

| Window | Source |
|---|---|
| 1 to 395 days | Power BI semantic model |
| 396+ days | Azure Synapse workspace (SynapseWorkspaceUrl) |

### Output Schema

One row per calendar day containing: raw metric value, each rolling average, WoW/MoM/YoY
growth rates, seasonal component values (when requested), and confidence interval bounds.
A `summary` object provides overall trend direction, peak date, trough date, average WoW
and MoM growth, and a seasonality strength index.

### Retry Policy

| Parameter | Value |
|---|---|
| Max retries | 3 |
| Initial delay | 15 seconds |
| Backoff multiplier | 2 |
| Max delay | 120 seconds |

---

## Flow 3: AnomalyDetection

### Purpose

Scheduled to run daily at 06:30 UTC after the POS sync and KPI cache refresh have
completed. Evaluates five KPIs (NetSalesAmount, GrossMarginPct, SellThroughRatePct,
UnitsOnHand, WeeksCoverValue) across all active stores. Flags any store whose metric
value deviates two or more standard deviations from the regional mean as an anomaly.
Categorizes anomalies as positive (overperformance) or negative (underperformance) and
writes alert records to the `AnomalyAlerts` Dataverse table. Triggers
`SendAnomalyAlertNotification` for high and critical severity anomalies.

### Schedule

Daily recurrence at 06:30 UTC.

### KPIs Evaluated

| Metric | Description |
|---|---|
| NetSalesAmount | Daily net sales amount per store |
| GrossMarginPct | Gross margin percentage per store |
| SellThroughRatePct | Sell-through rate percentage per store |
| UnitsOnHand | End-of-day units on hand per store |
| WeeksCoverValue | Weeks of cover per store |

### Detection Steps

1. **Aggregate**: Query the Power BI semantic model for the current day's metric values
   grouped by StoreId and RegionCode for all active stores.
2. **Regional statistics**: For each RegionCode and metric combination, calculate the
   mean and standard deviation across all stores in that region.
3. **Z-score**: Compute `z_score = (store_value - regional_mean) / regional_std_dev`.
   Skip stores where `regional_std_dev = 0` (no variance in region).
4. **Flag anomalies**: Flag as anomaly when `abs(z_score) >= AnomalyDetectionStdDevThreshold`
   (default 2.0). Positive anomaly when z-score is above the positive threshold; negative
   when below the negative threshold.
5. **Assign severity**:

| abs(z-score) Range | Severity |
|---|---|
| 2.0 to 2.49 | low |
| 2.5 to 2.99 | medium |
| 3.0 to 3.99 | high |
| 4.0 and above | critical |

6. **Write alerts**: Upsert an `AnomalyAlerts` record for each detected anomaly using the
   composite upsert key `(StoreId, MetricName, DetectionPeriod)`. New anomalies are
   written with `Status = new`.
7. **Notify**: For anomalies with `Severity` equal to `high` or `critical`, call
   `SendAnomalyAlertNotification` to post a summary to the analytics Teams channel.

### AnomalyAlerts Table

| Column | Type | Description |
|---|---|---|
| AnomalyAlertId | string | Primary key |
| DetectedAt | datetime | UTC timestamp of detection |
| StoreId | lookup (StoreMaster) | Store where anomaly was detected |
| RegionCode | string | Store's region |
| MetricName | string | KPI that triggered the anomaly |
| MetricValue | decimal | Store's observed metric value |
| RegionalMean | decimal | Regional mean for the metric |
| RegionalStdDev | decimal | Regional standard deviation |
| ZScore | decimal | Standard deviations from the mean |
| AnomalyType | choice | positive or negative |
| Severity | choice | low, medium, high, critical |
| DetectionPeriod | string | Date label for the anomaly period |
| Status | choice | new, acknowledged, resolved |
| AcknowledgedBy | string | User who acknowledged the alert |
| AcknowledgedAt | datetime | Acknowledgement timestamp |
| ResolvedAt | datetime | Resolution timestamp |
| ResolutionNotes | string | Free-text resolution notes |
| CorrelationId | string | Flow run correlation ID |

### Monitoring

The AnomalyDetection flow writes a `PipelineHealth` row on each run. Scheduled to
complete before 08:00 UTC (SLA). Failure alerts are routed to the pipeline alert Teams
channel.

### Retry Policy

| Parameter | Value |
|---|---|
| Max retries | 3 |
| Initial delay | 30 seconds |
| Backoff multiplier | 2 |
| Max delay | 240 seconds |

---

## Flow 4: WhatIfScenario

### Purpose

Projects the revenue and margin impact of hypothetical business changes. The agent
collects parameter variations from the user (price change %, promotional discount %,
stock increase %) and calls this flow. The flow retrieves historical price and promotion
elasticity data from the Power BI semantic model over the `ElasticityDataLookbackDays`
window, applies the scenario parameters, and returns a scenario comparison table showing
baseline and projected values for all key KPIs.

### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| scope | object | Yes | StoreId and/or CategoryCode and/or BrandName (at least one required) |
| base_period | string | No | Reference period for baseline (default: LastMonth) |
| price_change_pct | decimal | No | Percentage change to average selling price (positive = increase) |
| promo_discount_pct | decimal | No | Promotional discount percentage applied on top of current price |
| stock_increase_pct | decimal | No | Percentage increase in available stock units |

### Calculation Steps

1. **Elasticity lookup**: Query the semantic model for historical price elasticity
   (`% change in units_sold / % change in price`) and promotional lift factor over the
   `ElasticityDataLookbackDays` window for the requested scope.
2. **Baseline metrics**: Retrieve baseline values for `NetSalesAmount`, `GrossMarginAmount`,
   `GrossMarginPct`, `UnitsSold`, `AverageSellPrice` for the scope and base_period.
3. **Projected units**: Apply price elasticity to estimate volume change from
   `price_change_pct`. Apply promotion lift to estimate additional units from
   `promo_discount_pct`. Apply stock availability multiplier from `stock_increase_pct`
   (capped at historical demand ceiling to avoid over-optimistic projections).
4. **Projected revenue**: `projected_units * adjusted_sell_price` where
   `adjusted_sell_price` accounts for both `price_change_pct` and `promo_discount_pct`.
5. **Projected margin**: Calculated using `StandardCost` from `ProductCatalog` and
   `adjusted_sell_price`. Returns absolute margin and margin percentage.

### Output Schema

- `scope_description`: Plain-text scope summary
- `base_period`: Reference period used
- `parameters_applied`: Echo of input parameters
- `scenario_comparison`: One row per KPI showing `kpi`, `baseline`, `projected`,
  `delta_absolute`, `delta_pct`
- `elasticity_inputs`: Elasticity and lift coefficients used (transparent assumptions)
- `confidence_note`: Qualitative note on data depth (e.g., "Based on 12 months of data")

### Retry Policy

| Parameter | Value |
|---|---|
| Max retries | 3 |
| Initial delay | 10 seconds |
| Backoff multiplier | 2 |
| Max delay | 80 seconds |

---

## Flow 5: CrossDomainCorrelation

### Purpose

Identifies statistically significant external drivers of sales performance changes by
correlating retail sales data with three external signal categories: weather
(temperature, precipitation, extreme events), local events calendar (concerts, sports,
holidays, festivals), and social media sentiment (brand mentions, trending topics).

The flow ingests external data for the analysis window, pairs it with the daily sales
metric series from the Power BI semantic model, and calculates Pearson correlation
coefficients with two-tailed p-value testing. Only correlations below the
`CorrelationSignificanceLevel` threshold (default 0.05) are returned. Lag analysis
(up to 7 days) identifies leading indicators where an external signal on day D predicts
sales on day D+N.

### Input Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| metric | string | Yes | Sales metric to correlate (e.g., NetSalesAmount, UnitsSold) |
| filters | object | Yes | Slicer context (at least StoreId or RegionCode required for geographic scoping) |
| analysis_window_days | integer | Yes | Days to include (minimum 28, maximum 365) |
| signals | array of string | No | Signal categories to include: weather, local_events, social_media_sentiment (default: all three) |

### External Signal Sources

**Weather (WeatherConnector)**
- Daily maximum temperature (Celsius)
- Daily minimum temperature (Celsius)
- Total precipitation (mm)
- Extreme weather event flag (storm, heatwave, heavy snow)
- Geographic matching: nearest weather station to store postcode

**Local Events (EventsCalendarConnector)**
- Event count within 5 km of store
- Dominant event category (concert, sports, festival, public_holiday, market, other)
- Estimated total attendance near store
- Public holiday flag for store country
- Geographic radius: 5 km

**Social Media Sentiment (SocialMediaConnector)**
- Daily brand mention count
- Aggregate sentiment score (-1.0 to +1.0)
- Trending topic flag for brand or product hashtags in store's geographic market

### Analysis Steps

1. Retrieve the daily metric series from the Power BI semantic model for the
   analysis window.
2. Retrieve external signal series in parallel from WeatherConnector,
   EventsCalendarConnector, and SocialMediaConnector.
3. Align all series on calendar date. Flag days with missing external data.
4. For each signal variable, calculate the Pearson correlation coefficient (r) and
   two-tailed p-value against the metric series.
5. Repeat correlation calculation for each lag offset from 1 to 7 days (signal leads
   metric by N days).
6. Filter to correlations where `p_value < CorrelationSignificanceLevel`.
7. Rank significant correlations by `abs(r)` descending.
8. Generate a plain-text interpretation for each significant correlation.
9. Return results with `data_coverage_pct` reporting the percentage of days with
   complete data across all three signal categories.

### Output Schema

- `metric`: Metric correlated
- `analysis_window_days`: Window size
- `analysis_period`: `start_date` and `end_date`
- `significant_correlations`: Array of significant results, each with `signal_category`,
  `signal_name`, `correlation_coefficient`, `p_value`, `lag_days`, and `interpretation`
- `non_significant_signals`: Signals tested but not meeting the threshold
- `data_coverage_pct`: Percentage of days with complete signal data

### Custom Connectors

| Connector | Authentication | Base URL Variable |
|---|---|---|
| WeatherConnector | API key (X-Api-Key header) | WeatherApiBaseUrl |
| EventsCalendarConnector | API key (X-Api-Key header) | EventsCalendarApiBaseUrl |
| SocialMediaConnector | API key (X-Api-Key header) | SocialMediaApiBaseUrl |

### Error Handling

- Partial signal failure (one or two signal categories unavailable): flow continues with
  available signals and includes a `data_coverage_warning` in the output.
- Full failure: return empty `significant_correlations` with an error message.

### Retry Policy

| Parameter | Value |
|---|---|
| Max retries | 3 |
| Initial delay | 15 seconds |
| Backoff multiplier | 2 |
| Max delay | 120 seconds |

---

## Environment Variables

The following environment variables must be configured for the analytics pipeline flows.

| Variable | Flow | Description |
|---|---|---|
| PowerBiWorkspaceId | All | Power BI workspace GUID |
| PowerBiDatasetId | All | Semantic model (dataset) GUID |
| SynapseWorkspaceUrl | TrendAnalysis | Azure Synapse workspace URL for long-window queries |
| AnomalyDetectionStdDevThreshold | AnomalyDetection | Z-score threshold for anomaly detection (default 2.0) |
| AnalyticsTeamsChannelId | AnomalyDetection | Teams channel for high/critical anomaly notifications |
| TrendAnalysisConfidenceLevel | TrendAnalysis | Confidence level for computed intervals (default 0.95) |
| ElasticityDataLookbackDays | WhatIfScenario | Days of history used for elasticity calculation (default 365) |
| WeatherApiBaseUrl | CrossDomainCorrelation | Weather API base URL |
| WeatherApiKey | CrossDomainCorrelation | Weather API key |
| EventsCalendarApiBaseUrl | CrossDomainCorrelation | Events calendar API base URL |
| EventsCalendarApiKey | CrossDomainCorrelation | Events calendar API key |
| SocialMediaApiBaseUrl | CrossDomainCorrelation | Social media API base URL |
| SocialMediaApiKey | CrossDomainCorrelation | Social media API key |
| CorrelationSignificanceLevel | CrossDomainCorrelation | p-value threshold for significance (default 0.05) |

---

## Folder Structure

```
power-analysis/
├── README.md
├── runbook.md
├── docs/
│   ├── data-sync-pipelines.md
│   └── analytics-pipelines.md   (this file)
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```
