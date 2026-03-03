# Power Analysis Agent — Clothing Retail Deep Reasoning

The Power Analysis agent is a Copilot Studio analytical reasoning assistant for a global clothing retailer with 200+ stores and a multi-brand portfolio.  
This solution is designed for explanation and decision support, not only metric retrieval. It decomposes broad performance questions into sequenced analytical steps across sales, inventory, staffing, and external factors.

## Solution Positioning

Power Analysis is built for complex retail analysis scenarios such as:
- "Why did Store X underperform last week?"
- "Which brands are driving margin decline in the North region?"
- "What replenishment action is needed to recover sell-through in outerwear?"

It supports multi-step reasoning through topic chaining with context variable passing, Dataverse as the operational data fabric, and Power Automate flows for semantic-model query execution.

## Dataverse Data Model

The agent uses Dataverse as the central model synchronized from POS, ERP, and allocation systems.

| Table | Purpose | Key Columns |
|------|---------|-------------|
| **SalesTransactions** | Transaction-level sales facts | TransactionId, StoreId, ProductId, TransactionDate, UnitsSold, NetSalesAmount, DiscountAmount, GrossMarginAmount, Channel |
| **ProductCatalog** | Product and assortment dimensions | ProductId, SKU, Brand, Category, SubCategory, Season, LifecycleStatus, StandardCost |
| **StoreMaster** | Store attributes and hierarchy | StoreId, StoreName, Region, Country, Format, OpeningDate, FloorSpaceSqM, Cluster |
| **InventorySnapshots** | Periodic inventory positions | SnapshotId, SnapshotDate, StoreId, ProductId, UnitsOnHand, UnitsReceived, InventoryCost, WeeksCover, ReorderPoint |
| **AlertRules** | Configurable alert threshold definitions | AlertRuleId, RuleName, Metric, Operator, Threshold, Scope, ScopeValue, CompoundLogic, EvaluationFrequency, Owner, IsActive |
| **AlertHistory** | Log of triggered alert events | AlertHistoryId, AlertRuleId, TriggeredAt, MetricValue, ThresholdValue, Status (new/acknowledged/resolved), AcknowledgedBy, ResolvedAt, ResolutionNotes |
| **SavedAnalyses** | Persisted analysis snapshots | SavedAnalysisId, AnalysisName, QueryParameters, ResultSnapshot, GeneratedInsights, AnalysisType, SavedAt, Owner, SharedWith, IsShared |
| **ScheduledReports** | Recurring report delivery definitions | ScheduledReportId, ReportName, CronSchedule, HumanReadableSchedule, QueryDefinition, Recipients, OutputFormat, FlowRunId, Owner, IsActive, NextRunAt |

## Analytical Reasoning Patterns

- **Decomposition reasoning**: Breaks high-level questions into sub-queries (sales trend, inventory pressure, brand/category mix, labor impact, and exogenous factors).
- **Comparative reasoning**: Performs store-to-store, period-over-period, and peer-cluster comparisons.
- **Predictive reasoning**: Runs what-if scenarios and projected impact calculations using adjustable assumptions.
- **Anomaly detection reasoning**: Identifies unusual KPI shifts and attributes likely contributors.

## Reporting and Alerting

The agent provides a full natural-language interface for managing alerts, saving analyses, and scheduling reports backed by Dataverse.

### Alert Management

| Capability | Example Phrase |
|-----------|---------------|
| Create alert rule | "Notify me when any store's daily sales drop below 80% of target" |
| List alert rules | "What alerts do I have set up?" |
| Modify alert rule | "Change the threshold on my North region margin alert to 25%" |
| Delete alert rule | "Remove the Store 42 alert rule" |
| View active alerts | "What alerts are firing right now?" |
| Acknowledge alert | "Acknowledge the Store 42 alert, we are aware of the issue" |
| Resolve alert | "Resolve the North region inventory alert, stock has been replenished" |

Alert rules support:
- Single-condition thresholds on any metric
- Compound rules with AND/OR logic across two metrics
- Scope at store, region, category, or enterprise level
- Evaluation frequency from real-time through weekly

Alert lifecycle: **new -> acknowledged -> resolved**

### Saved Analyses

| Capability | Example Phrase |
|-----------|---------------|
| Save analysis | "Save this analysis" |
| Recall analysis | "Show me the analysis I saved last Tuesday" |
| Share analysis | "Share my saved analysis with the regional team" |

Saved analyses capture the full query parameter set, results snapshot, and generated insights for recall or sharing at any time.

### Scheduled Reports

| Capability | Example Phrase |
|-----------|---------------|
| Create report | "Send me this report every Monday at 8am" |
| List reports | "What reports do I have scheduled?" |
| Modify report | "Change my weekly report to also include the South region" |
| Cancel report | "Stop sending the Monday inventory report" |

Scheduled reports provision a Power Automate recurrence flow per report and support Teams message, email, and PDF delivery formats.

## Core KPI Framework

| KPI | Formula | Primary Use |
|-----|---------|-------------|
| **Sell-Through Rate (STR)** | `(Units Sold / Units Received) x 100` | Allocation efficiency and demand realization |
| **GMROI** | `Gross Margin / Average Inventory Cost` | Margin return quality on inventory investment |
| **Weeks of Cover (WoC)** | `Ending Inventory / Average Weekly Sales` | Replenishment urgency and overstock risk |
| **Stock Turn** | `Cost of Goods Sold / Average Inventory Cost` | Inventory velocity and capital efficiency |
| **Open-to-Buy (OTB)** | `Planned Inventory - (On Order + Current Inventory)` | Buying headroom and commitment control |

## Folder Structure

```
power-analysis/
├── README.md
├── runbook.md
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```

## AI Builder Integration

Version 2.0 extends the agent with four AI Builder models that deliver advanced
capabilities beyond rule-based analytics.

### Demand Forecasting

- Model type: AI Builder prediction model
- Trained on 2+ years of historical `SalesTransactions` data
- Predicts next-period demand by SKU and store combination
- Factors in seasonality, promotions, and trend signals
- Agent topic: **"What should I expect to sell next week?"**
- Outputs: predicted units, confidence interval, key demand drivers, seasonality index
- Forecast results stored in the `DemandForecasts` Dataverse table

### Category Classification

- Model type: AI Builder text classification model
- Trained on the active `ProductCatalog` with verified category labels
- Auto-classifies new products based on name, description, material, and demographic attributes
- Results above the confidence threshold are written to `ProductCatalog` automatically
- Results below the threshold are queued for human review
- Agent topic: **"Classify these new arrivals"**

### Sentiment Analysis

- Model type: AI Builder sentiment analysis model
- Analyzes customer feedback from surveys, reviews, and social media
- Returns sentiment breakdown (positive / neutral / negative) and key themes
- Tracks sentiment trends by product category and brand over configurable windows
- Triggers a Teams alert when negative sentiment exceeds the configured threshold
- Sentiment results stored in the `SentimentResults` Dataverse table
- Agent topic: **"What are customers saying about our new denim line?"**

### Document Processing

- Model type: AI Builder document processing (form processing) model
- Extracts structured data from supplier invoices, delivery notes, and competitor price sheets
- Supports PDF, PNG, JPEG, and TIFF uploads via the agent conversation
- Extracted data written to `DocumentExtractionResults` for review and approval
- Agent topic: **"Process supplier invoice"** or **"Extract data from delivery note"**

## AI Builder Dataverse Tables

| Table | Purpose |
|-------|---------|
| **DemandForecasts** | Forecast model outputs per SKU, store, and horizon |
| **SentimentResults** | Sentiment analysis outputs per category, brand, and period |
| **DocumentExtractionResults** | Structured extraction results for uploaded documents |

## Quick Start

1. Provision Dataverse schema and security as documented in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Copilot Studio solution-aware environment.
3. Configure sync pipelines for POS, ERP, and inventory snapshots.
4. Configure and validate the Power Automate analytical flows referenced by the agent template.
5. Publish to Teams or web channel and execute validation tests for decomposition and root-cause scenarios.
6. Configure AI Builder models and bind `DemandForecastingModelId`, `CategoryClassificationModelId`, `SentimentAnalysisModelId`, and `DocumentProcessingModelId` environment variables as documented in `runbook.md`.
