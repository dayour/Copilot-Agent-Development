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
| **BasketDetails** | Line-item basket contents per transaction | BasketDetailId, SalesTransactionId, ProductId, LineNumber, Quantity, LineNetAmount, LineGrossMarginAmount |
| **TenderMix** | Payment method breakdown per transaction | TenderMixId, SalesTransactionId, TenderType, TenderAmount |
| **ProductCatalog** | Product and assortment dimensions | ProductId, SKU, Brand, Category, SubCategory, Season, LifecycleStatus, StandardCost |
| **StoreMaster** | Store attributes and hierarchy | StoreId, StoreName, Region, Country, Format, OpeningDate, FloorSpaceSqM, Cluster |
| **InventorySnapshots** | Periodic inventory positions | SnapshotId, SnapshotDate, StoreId, ProductId, UnitsOnHand, UnitsReceived, InventoryCost, WeeksCover, ReorderPoint |
| **PurchaseOrders** | ERP purchase order lines | PurchaseOrderId, ProductId, StoreId, OrderDate, OrderedQuantity, ReceivedQuantity, UnitCost, POStatus |
| **StockMovements** | Incremental inventory movements | StockMovementId, MovementDate, StoreId, ProductId, MovementType, QuantityChange, PostedTimestamp |
| **TransferOrders** | Inter-store and DC-to-store transfers | TransferOrderId, ProductId, FromStoreId, ToStoreId, TransferQuantity, TransferStatus |
| **KpiCache** | Pre-calculated KPIs refreshed every 4 hours | KpiCacheId, CacheTimestamp, GrainType, DimensionKey, PeriodKey, SellThroughRatePct, GmroiValue |
| **PipelineHealth** | Pipeline run health and data quality results | PipelineHealthId, PipelineName, RunStatus, RecordsProcessed, RecordsFailed, DataQualityChecksPassed |
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
├── connectors/
│   ├── erp-connector.yaml
│   ├── pos-connector.yaml
│   └── allocation-connector.yaml
├── docs/
│   └── data-sync-pipelines.md
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```

## Custom Connectors

Three custom Power Platform connectors integrate the agent with the retailer's core operational
systems. All connectors use the OAuth2 client credentials flow (no user interaction required at
runtime) and include rate limiting, exponential backoff retry, and circuit breaker policies.
Full connector definitions including all parameters and response schemas are in the `connectors/`
directory.

### ERP Connector

Connects to the SAP or Oracle ERP system for purchase order data, supplier lead times, and cost prices.

| Operation | Description |
|---|---|
| `GetPurchaseOrders` | Retrieve POs by date range, supplier code, or status. Supports delta sync via `modified_since`. |
| `GetSupplierLeadTime` | Get lead time in days by supplier code and optional product category or season. |
| `GetCostPrice` | Get the standard cost price for a SKU with optional currency and effective date. |
| `GetOpenOrders` | List all open and partially received purchase orders with optional supplier and category filters. |
| `GetHealthStatus` | Health probe endpoint for the `ConnectorHealthCheckScheduled` flow. |

Connection reference: `cr_erp_clothing`
Definition file: `connectors/erp-connector.yaml`

### POS Connector

Connects to the point-of-sale system for transaction data, basket composition, hourly sales, and
tender type breakdown.

| Operation | Description |
|---|---|
| `GetTransactions` | Retrieve transactions by store, date range, channel, and incremental watermark timestamp. |
| `GetBasketDetails` | Get full basket composition (line items) for a set of transaction IDs. |
| `GetHourlySales` | Get hourly sales breakdown (units, net sales, transaction count) by store and date. |
| `GetTenderMix` | Get payment method breakdown (Cash, Card, Digital Wallet, Gift Card, Loyalty Points) per transaction. |
| `GetHealthStatus` | Health probe endpoint for the `ConnectorHealthCheckScheduled` flow. |

Connection reference: `cr_pos_clothing`
Definition file: `connectors/pos-connector.yaml`

### Allocation System Connector

Connects to the merchandise allocation system for planned vs actual stock distribution, replenishment
pipeline status, and inter-store transfer orders.

| Operation | Description |
|---|---|
| `GetAllocationPlan` | Retrieve allocation plan by category and season with planned vs actual distribution per store. |
| `GetReplenishmentStatus` | Get replenishment pipeline status (pending orders, quantities in transit) by store. |
| `GetTransferOrders` | List inter-store and DC-to-store transfer orders with incremental sync support. |
| `GetInventorySnapshot` | Retrieve the full inventory snapshot for all stores and products (used for full upsert). |
| `GetStockMovements` | Retrieve incremental stock movements (sales, returns, transfers, adjustments) by watermark. |
| `GetHealthStatus` | Health probe endpoint for the `ConnectorHealthCheckScheduled` flow. |

Connection reference: `cr_allocation_clothing`
Definition file: `connectors/allocation-connector.yaml`

### Connector Reliability

All three connectors share the following cross-cutting policies:

| Policy | Configuration |
|---|---|
| Authentication | OAuth2 client credentials; token cached and refreshed 5 minutes before expiry |
| Retry policy | 3 retries with exponential backoff: 30 s, 60 s, 120 s (max 240 s) |
| Retryable status codes | 429, 500, 502, 503, 504 |
| Circuit breaker | Opens after 5 consecutive failures; 60-second recovery window |
| Rate limit handling | Respects `Retry-After` response header on 429 responses |
| Health monitoring | All connectors registered in `ConnectorHealthCheckScheduled` (15-minute probes) |

See `runbook.md` step 4 for OAuth2 registration and credential setup instructions.

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
2. Register OAuth2 client credentials for the ERP, POS, and Allocation connectors as documented in `runbook.md` step 4.
3. Import custom connectors from the `connectors/` directory and bind connection references as documented in `runbook.md` step 4d and 4e.
4. Import `solution/solution-definition.yaml` into the target Copilot Studio solution-aware environment.
5. Configure sync pipelines for POS, ERP, allocation, and KPI cache as documented in `runbook.md` step 6 and `docs/data-sync-pipelines.md`.
6. Configure and validate the Power Automate analytical flows referenced by the agent template.
7. Publish to Teams or web channel and execute validation tests for decomposition and root-cause scenarios.
8. Validate pipeline health by asking the agent: "Are all data feeds healthy?"
9. Configure AI Builder models and bind `DemandForecastingModelId`, `CategoryClassificationModelId`, `SentimentAnalysisModelId`, and `DocumentProcessingModelId` environment variables as documented in `runbook.md`.
