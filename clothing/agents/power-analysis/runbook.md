# Runbook — Power Analysis Agent (Clothing Retail)

## Overview

This runbook defines deployment, configuration, and operations for the Power Analysis deep reasoning agent.  
The solution combines Copilot Studio orchestration, Dataverse as the data fabric, Power BI semantic model querying through Power Automate, and Synapse Link for historical and heavy analytical workloads.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Copilot Studio license | Maker and runtime licensing in target environment |
| Power Platform environment | Dataverse-enabled, solution-aware environment |
| Power BI Premium / Fabric | Required for Execute Queries and semantic model access |
| Power Automate | Cloud flows for analytical query orchestration |
| Microsoft Entra ID | Authentication, least-privilege role assignment |
| Source system connectivity | POS, ERP, allocation feeds available for sync |
| Azure Data Lake / Synapse workspace | Required for Dataverse Synapse Link |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm environment region and compliance boundaries.
4. Ensure maker account has **System Customizer** and flow-creation permissions.

### 2. Provision Dataverse Schema
Create or import these tables:
- `SalesTransactions`
- `ProductCatalog`
- `StoreMaster`
- `InventorySnapshots`
- `BasketDetails`
- `TenderMix`
- `PurchaseOrders`
- `StockMovements`
- `TransferOrders`
- `KpiCache`
- `PipelineHealth`

Required column guidance:
- `SalesTransactions`: TransactionId (alternate key), StoreId (lookup), ProductId (lookup), TransactionDate, UnitsSold, NetSalesAmount, GrossMarginAmount, Channel
- `ProductCatalog`: ProductId (alternate key), SKU, Brand, Category, SubCategory, Season, StandardCost
- `StoreMaster`: StoreId (alternate key), StoreName, Region, Country, Format, Cluster
- `InventorySnapshots`: SnapshotId (alternate key), SnapshotDate, StoreId (lookup), ProductId (lookup), UnitsOnHand, UnitsReceived, InventoryCost, AvgWeeklySales, WeeksCover (calculated), ReorderPoint
- `BasketDetails`: BasketDetailId (alternate key), SalesTransactionId (lookup), ProductId (lookup), LineNumber, Quantity, UnitPrice, LineNetAmount, LineDiscountAmount, LineGrossMarginAmount, PromotionCode
- `TenderMix`: TenderMixId (alternate key), SalesTransactionId (lookup), TenderType, TenderAmount, TenderCurrency, TenderSequence
- `PurchaseOrders`: PurchaseOrderId (alternate key), ProductId (lookup), StoreId (lookup), OrderDate, ExpectedDeliveryDate, OrderedQuantity, ReceivedQuantity, OutstandingQuantity (calculated), UnitCost, TotalOrderValue, POStatus, SupplierCode, ModifiedDate
- `StockMovements`: StockMovementId (alternate key), MovementDate, StoreId (lookup), ProductId (lookup), MovementType, QuantityChange, ReferenceId, PostedTimestamp
- `TransferOrders`: TransferOrderId (alternate key), ProductId (lookup), FromStoreId (lookup), ToStoreId (lookup), RequestedDate, ExpectedArrivalDate, TransferQuantity, TransferStatus, ModifiedTimestamp
- `KpiCache`: KpiCacheId (alternate key), CacheTimestamp, GrainType, DimensionKey, PeriodKey, and all KPI measure columns
- `PipelineHealth`: PipelineHealthId (alternate key), PipelineName, RunStartTimestamp, RunEndTimestamp, RunStatus, RecordsProcessed, RecordsFailed, ErrorCode, ErrorMessage, RetryAttempt, DataQualityChecksPassed, DataQualityFailureDetails, SourceSystemTimestamp, CorrelationId
- `AlertRules`: AlertRuleId (alternate key), RuleName, Metric, Operator (choice), Threshold (decimal), ThresholdUnit, Scope (choice: store/region/category/enterprise), ScopeValue, CompoundLogic (choice: none/AND/OR), SecondaryMetric, SecondaryOperator, SecondaryThreshold, EvaluationFrequency (choice: real_time/hourly/daily/weekly), Owner, OwnerEntraId, IsActive (boolean, default true), CreatedOn, ModifiedOn
- `AlertHistory`: AlertHistoryId (alternate key), AlertRuleId (lookup to AlertRules), TriggeredAt, MetricValue (decimal), ThresholdValue (decimal), Scope, ScopeValue, Status (choice: new/acknowledged/resolved, default new), AcknowledgedBy, AcknowledgedAt, ResolvedAt, ResolutionNotes
- `SavedAnalyses`: SavedAnalysisId (alternate key), AnalysisName, QueryParameters (multiline text), ResultSnapshot (multiline text), GeneratedInsights (multiline text), AnalysisType (choice: sales_performance/root_cause/inventory/trend/what_if/anomaly), SavedAt, Owner, OwnerEntraId, SharedWith (multiline text), IsShared (boolean, default false)
- `ScheduledReports`: ScheduledReportId (alternate key), ReportName, CronSchedule, HumanReadableSchedule, QueryDefinition (multiline text), Recipients (multiline text), OutputFormat (choice: teams/email/pdf, default email), FlowRunId, Owner, OwnerEntraId, IsActive (boolean, default true), CreatedOn, LastRunAt, NextRunAt

Configure relationships:
1. `SalesTransactions.StoreId -> StoreMaster.StoreId` (N:1)
2. `SalesTransactions.ProductId -> ProductCatalog.ProductId` (N:1)
3. `InventorySnapshots.StoreId -> StoreMaster.StoreId` (N:1)
4. `InventorySnapshots.ProductId -> ProductCatalog.ProductId` (N:1)
5. `BasketDetails.SalesTransactionId -> SalesTransactions.SalesTransactionId` (N:1)
6. `BasketDetails.ProductId -> ProductCatalog.ProductId` (N:1)
7. `TenderMix.SalesTransactionId -> SalesTransactions.SalesTransactionId` (N:1)
8. `PurchaseOrders.ProductId -> ProductCatalog.ProductId` (N:1)
9. `PurchaseOrders.StoreId -> StoreMaster.StoreId` (N:1)
10. `StockMovements.StoreId -> StoreMaster.StoreId` (N:1)
11. `StockMovements.ProductId -> ProductCatalog.ProductId` (N:1)
12. `TransferOrders.ProductId -> ProductCatalog.ProductId` (N:1)
13. `TransferOrders.FromStoreId -> StoreMaster.StoreId` (N:1)
14. `TransferOrders.ToStoreId -> StoreMaster.StoreId` (N:1)
5. `AlertHistory.AlertRuleId -> AlertRules.AlertRuleId` (N:1)

Configure Dataverse calculated/rollup columns:
- `SellThroughRatePct = (UnitsSold / UnitsReceived) * 100`
- `GMROI = GrossMarginAmount / AverageInventoryCost`
- `WeeksCover = UnitsOnHand / AvgWeeklySales`
- `StockTurn = CostOfGoodsSold / AverageInventoryCost`
- `OpenToBuy = PlannedInventory - (OnOrderInventory + CurrentInventory)`

### 3. Configure Security Roles
Create least-privilege roles:
- `PowerAnalysis-AgentRuntime`: Read access to analytical tables and flow invocation
- `PowerAnalysis-BIAnalyst`: Read on all stores and products, run scenario topics
- `PowerAnalysis-StoreManager`: Row-level scoped access by StoreId/Region
- `PowerAnalysis-Admin`: Full configuration and troubleshooting rights

Additional access rules for reporting and alerting tables:
- `AlertRules`: All authenticated users can create rules; users can only update/delete their own rules unless they hold the `PowerAnalysis-Admin` Dataverse security role.
- `AlertHistory`: All authenticated users can read; only the rule owner or a user with the `PowerAnalysis-Admin` role can acknowledge/resolve.
- `SavedAnalyses`: Owners have full CRUD; records with IsShared=true are readable by all authenticated users in the environment.
- `ScheduledReports`: Owners have full CRUD on their own records; users with the `PowerAnalysis-Admin` role can manage all records.

The `User.IsAdmin` global variable is populated at session start by reading the authenticated user's Dataverse security role assignments. Map the Entra group assigned to `PowerAnalysis-Admin` to set this variable to `true`; all other users receive `false`.

Validate role mapping:
1. Map Entra groups to roles.
2. Test user-level data visibility in both Dataverse and flow outputs.

### 4. Import the Solution
1. Go to **Solutions** -> **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `PowerBiWorkspaceId`
   - `PowerBiDatasetId`
   - `AnalyticsTeamsChannelId`
   - `PipelineAlertTeamsChannelId`
   - `ScheduledReportsTeamsChannelId`
   - `ReportDefaultRecipients`
   - `PosApiBaseUrl`
   - `ErpApiBaseUrl`
   - `AllocationApiBaseUrl`
   - `SynapseWorkspaceUrl`
   - `DataLakeStorageAccountUrl`
   - `PosSyncLastSuccessfulTimestamp` (initial backfill start date)
   - `ErpSyncLastSuccessfulTimestamp` (initial backfill start date)
   - `AllocationSyncLastSuccessfulTimestamp` (initial backfill start date)
4. Verify imported components are healthy and connection references are bound.

### 5. Configure Data Pipeline Sync
Set up inbound pipelines. See `docs/data-sync-pipelines.md` for full data lineage,
transformation logic, error handling, and operational runbook details.

#### 5a. POS Data Sync (Daily Batch — 02:00 UTC)
- Source: POS API (`${PosApiBaseUrl}`)
- Targets: `SalesTransactions`, `BasketDetails`, `TenderMix`
- Strategy: Incremental load using `TransactionTimestamp` watermark stored in environment variable `PosSyncLastSuccessfulTimestamp`
- Upsert key: `SalesTransactionId` (transactions), `BasketDetailId` (basket lines), `TenderMixId` (tender)
- Estimated volume: 500K to 1M transactions per day across all stores
- Retry policy: 3 attempts with exponential backoff (30s, 60s, 120s)
- SLA: Complete by 06:00 UTC

Steps:
1. Import the `PosConnector` custom connector from the solution.
2. Bind the connection reference `cr_pos_clothing` to a service account with POS API read access.
3. Set environment variable `PosApiBaseUrl` to the POS API base URL.
4. Initialize `PosSyncLastSuccessfulTimestamp` to the desired historical start date in ISO 8601 UTC format (for example `2025-01-01T00:00:00Z`). For a full backfill, set this to the earliest required transaction date. For incremental-only (no backfill), set it to the current UTC datetime.
5. Enable and activate the `PosDataSync` Power Automate flow.
6. Trigger a manual run and verify rows are written to `SalesTransactions`, `BasketDetails`, and `TenderMix`.
7. Confirm `PipelineHealth` shows a `Succeeded` status row.

#### 5b. ERP Data Sync (Daily — 03:00 UTC)
- Source: ERP API (`${ErpApiBaseUrl}`)
- Targets: `ProductCatalog`, `PurchaseOrders`
- Strategy: Delta sync using `ModifiedDate` field on source records
- Upsert key: `ProductId` (catalog), `PurchaseOrderId` (POs)
- Estimated volume: ~10K product updates and ~5K PO lines per day
- Retry policy: 3 attempts with exponential backoff (30s, 60s, 120s)
- SLA: Complete by 07:00 UTC

Steps:
1. Import the `ErpConnector` custom connector from the solution.
2. Bind the connection reference `cr_erp_clothing` to a service account with ERP API read access.
3. Set environment variable `ErpApiBaseUrl` to the ERP API base URL.
4. Initialize `ErpSyncLastSuccessfulTimestamp` to the desired start date in ISO 8601 UTC format (for example `2025-01-01T00:00:00Z`).
5. Enable and activate the `ErpDataSync` Power Automate flow.
6. Trigger a manual run and verify rows are written to `ProductCatalog` and `PurchaseOrders`.
7. Confirm `PipelineHealth` shows a `Succeeded` status row.

#### 5c. Allocation Data Sync (Hourly)
- Source: Allocation API (`${AllocationApiBaseUrl}`)
- Targets: `InventorySnapshots` (full snapshot), `StockMovements` (incremental), `TransferOrders` (incremental)
- Strategy: Full snapshot upsert for inventory; incremental load using `PostedTimestamp` and `ModifiedTimestamp` for movements and transfers
- Upsert keys: `SnapshotId` (composite: SnapshotDate + StoreId + ProductId), `StockMovementId`, `TransferOrderId`
- Estimated volume: ~200K inventory records per snapshot
- Retry policy: 3 attempts with exponential backoff (30s, 60s, 120s)
- SLA: Complete within 30 minutes of each hourly trigger

Steps:
1. Import the `AllocationConnector` custom connector from the solution.
2. Bind the connection reference `cr_allocation_clothing` to a service account with Allocation API read access.
3. Set environment variable `AllocationApiBaseUrl` to the Allocation API base URL.
4. Initialize `AllocationSyncLastSuccessfulTimestamp` to the desired start date in ISO 8601 UTC format (for example `2025-01-01T00:00:00Z`).
5. Enable and activate the `AllocationDataSync` Power Automate flow.
6. Trigger a manual run and verify rows are written to `InventorySnapshots`, `StockMovements`, and `TransferOrders`.
7. Confirm `PipelineHealth` shows a `Succeeded` status row.

#### 5d. KPI Cache Refresh (Every 4 Hours)
- Source: Power BI semantic model (`${PowerBiDatasetId}` in workspace `${PowerBiWorkspaceId}`)
- Target: `KpiCache`
- Strategy: Scheduled query of pre-calculated KPIs; insert new cache rows with current timestamp
- Grains: StoreScorecard, CategoryPerformance, RegionalSummary
- Retry policy: 3 attempts with exponential backoff (60s, 120s, 240s)
- SLA: Complete within 45 minutes of each 4-hour trigger

Steps:
1. Bind the Power BI connection reference `cr_powerbi_clothing` to a service account with Power BI workspace reader access.
2. Set environment variables `PowerBiWorkspaceId` and `PowerBiDatasetId`.
3. Enable and activate the `KpiCacheRefresh` Power Automate flow.
4. Trigger a manual run and verify rows are inserted into `KpiCache`.
5. Confirm `PipelineHealth` shows a `Succeeded` status row.

#### 5e. Pipeline Health Alert (Event-Triggered)
- Trigger: Dataverse row created in `PipelineHealth` with `RunStatus = Failed` or `PartialFailure`
- Action: Post alert to Teams channel `${PipelineAlertTeamsChannelId}`

Steps:
1. Set environment variable `PipelineAlertTeamsChannelId` to the Teams channel ID for pipeline operations alerts.
2. Enable and activate the `PipelineHealthAlert` Power Automate flow.
3. Simulate a failure by manually creating a `PipelineHealth` row with `RunStatus = Failed` and verify the Teams alert is posted.

### 6. Configure Power Automate Analytical Flows
Bind and test the flows:

#### Flow: `MultiMeasureQuery`
Purpose: execute parameterized DAX for KPI retrieval.

Example DAX pattern:
```dax
EVALUATE
SUMMARIZECOLUMNS(
    'StoreMaster'[StoreName],
    'ProductCatalog'[Category],
    "SellThroughRate", DIVIDE([Units Sold], [Units Received]) * 100,
    "GMROI", DIVIDE([Gross Margin], [Average Inventory Cost]),
    "WeeksCover", DIVIDE([Ending Inventory Units], [Average Weekly Sales])
)
```

#### Flow: `TrendAnalysis`
Purpose: period-over-period changes by store, category, brand, and channel.

Example DAX pattern:
```dax
EVALUATE
ADDCOLUMNS(
    SUMMARIZE('Date', 'Date'[FiscalWeek]),
    "CurrentSales", [Net Sales],
    "PriorSales", CALCULATE([Net Sales], DATEADD('Date'[Date], -1, YEAR)),
    "YoYPercent", DIVIDE([Net Sales] - CALCULATE([Net Sales], DATEADD('Date'[Date], -1, YEAR)), CALCULATE([Net Sales], DATEADD('Date'[Date], -1, YEAR)))
)
```

#### Flow: `AnomalyDetection`
Purpose: detect deviations vs baseline and trigger alerts.

Example DAX pattern:
```dax
EVALUATE
FILTER(
    ADDCOLUMNS(
        SUMMARIZE('StoreMaster', 'StoreMaster'[StoreName]),
        "SalesDeltaStdDev", [Sales Z-Score],
        "MarginDeltaStdDev", [Margin Z-Score]
    ),
    ABS([SalesDeltaStdDev]) >= 2 || ABS([MarginDeltaStdDev]) >= 2
)
```

#### Flow: `WhatIfScenario`
Purpose: project impact of parameter changes (price, markdown, demand uplift).

Example DAX pattern:
```dax
EVALUATE
ROW(
    "ProjectedRevenue", [Base Revenue] * (1 + @DemandLiftPct),
    "ProjectedMargin", ([Base Revenue] * (1 + @DemandLiftPct)) - ([Base Cost] * (1 + @CostInflationPct)),
    "ProjectedSellThrough", [Base SellThrough] + @SellThroughLiftPct
)
```

### 7. Configure Reporting and Alerting Flows
Bind and test the Dataverse-backed flows for alert management, saved analyses, and scheduled reports.

#### Alert Rules Flows
- **AlertRuleCreate**: Validates inputs (metric name against allowed list, numeric threshold) before writing to `AlertRules`. Rejects requests where the owner is not the authenticated user.
- **AlertRuleUpdate**: Reads existing record, validates ownership or admin flag, applies field patch, sets `ModifiedOn`.
- **AlertRuleDelete**: Sets `IsActive = false`. Does not hard-delete to preserve audit trail.
- **AlertRuleList**: Returns records filtered by `OwnerEntraId` for non-admin users; returns all active records for admin users.

#### Alert Evaluation Flow
- **AlertRuleEvaluator** (scheduled hourly): Iterates active `AlertRules`, queries the semantic model for current metric values, evaluates single and compound conditions, writes new `AlertHistory` records for breaches with status `new`.
  - For compound AND rules: both conditions must be true.
  - For compound OR rules: either condition triggers the alert.
  - Duplicate suppression: before writing, check for an existing `AlertHistory` record with the same `AlertRuleId`, `ScopeValue`, and `Status = new` that was created within the same calendar day. If one exists, skip writing to avoid duplicate alert noise.
  - Limitation: `AlertRules` records configured with `EvaluationFrequency = real_time` are not supported by this scheduled flow. Real-time evaluation requires a separate event-driven flow triggered by Dataverse record changes or a streaming data source. Document this limitation when creating rules with real-time frequency.

#### Alert History Flows
- **AlertHistoryQuery**: Accepts status filter (new/acknowledged/all_open), optional scope value, and date range. Returns paginated list.
- **AlertAcknowledge**: Sets `Status = acknowledged`, `AcknowledgedBy = User.EntraId`, `AcknowledgedAt = now()`.
- **AlertResolve**: Sets `Status = resolved`, `ResolvedAt = now()`, persists optional `ResolutionNotes`.

#### Saved Analysis Flows
- **SavedAnalysisCreate**: Writes query parameters, result snapshot, and insights. Sets `SavedAt = now()` and `OwnerEntraId`.
- **SavedAnalysisQuery**: Fuzzy-matches `AnalysisName` and filters by `SavedAt` date range. Returns records owned by the user plus shared records where `IsShared = true`.
- **SavedAnalysisShare**: Appends recipient to `SharedWith` (semicolon-delimited), sets `IsShared = true`.
- **SavedAnalysisDelete**: Hard-deletes record after confirming owner match or admin role.

#### Scheduled Report Flows
- **ScheduledReportCreate**: Translates `HumanReadableSchedule` to a cron expression, writes the `ScheduledReports` record, and provisions a Power Automate recurrence flow. Stores the resulting `FlowRunId`.
- **ScheduledReportList**: Returns active reports for the user with `NextRunAt` and `LastRunAt`.
- **ScheduledReportUpdate**: Patches the modified field on the Dataverse record and re-configures the backing recurrence flow.
- **ScheduledReportCancel**: Sets `IsActive = false`, disables the backing recurrence flow via Power Automate Management connector.
- **ScheduledReportDelivery**: Executes the stored `QueryDefinition`, formats results, and sends via Teams, email, or PDF according to `OutputFormat`. Updates `LastRunAt` and `NextRunAt` on completion.

### 8. Configure Data Quality Validation
Implement and schedule a dedicated validation routine before agent publish and daily after sync:

Validation checks:
- Freshness: source latency by table
- Completeness: required column null checks
- Uniqueness: TransactionId and Snapshot composite keys
- Referential integrity: orphaned StoreId/ProductId lookups
- Range checks: non-negative units/cost, margin bounds, realistic WoC range
- Reconciliation: POS totals vs semantic model totals at day/store level

If any critical rule fails, stop publish promotion and notify data engineering.

### 8. Configure Dataverse Synapse Link
1. Enable Synapse Link on Dataverse environment.
2. Select tables for export:
   - `SalesTransactions`
   - `BasketDetails`
   - `TenderMix`
   - `InventorySnapshots`
   - `StockMovements`
   - `PurchaseOrders`
   - `ProductCatalog`
   - `StoreMaster`
3. Configure export to ADLS Gen2 (`${DataLakeStorageAccountUrl}`) and attach Synapse workspace (`${SynapseWorkspaceUrl}`).
4. Build historical analytical views (multi-year trend and seasonality).
5. Route long-window queries and heavy aggregations (greater than 13 months) to Synapse-backed datasets.
6. Verify Synapse Link export health daily (see Monitoring and Operations section).

### 9. Configure Authentication and Channel
1. In Copilot Studio, set authentication to **Microsoft Entra ID**.
2. Validate user context propagation into flow calls, including `User.EntraId` and `User.IsAdmin` variable population at session start.
3. Publish to Teams and run controlled UAT with analyst and store manager personas.

---

## Post-Deployment Validation

- [ ] Sales Performance returns STR, GMROI, and WoC with correct formulas
- [ ] Root Cause Analysis executes topic chain and returns decomposed drivers
- [ ] Inventory Intelligence generates reorder actions from Weeks of Cover thresholds
- [ ] Trend Detection explains period-over-period movement and contributing dimensions
- [ ] What-If Analysis returns projected KPI changes with input assumptions
- [ ] Anomaly Alerts identify threshold breaches and notify designated channel
- [ ] Alert rule creation, listing, modification, and deletion work via conversation
- [ ] Compound AND/OR alert rules evaluate correctly against live metric values
- [ ] Alert lifecycle transitions (new to acknowledged, acknowledged to resolved) are persisted correctly
- [ ] Saved analysis create, recall, and share operations succeed end-to-end
- [ ] Scheduled report creation provisions a Power Automate recurrence flow
- [ ] Scheduled report delivery sends formatted output to configured recipients
- [ ] Scheduled report cancellation disables the backing recurrence flow
- [ ] Owner-level authorization prevents users from modifying other users' rules and reports
- [ ] Admin role allows cross-user management of all alert rules and reports
- [ ] Data quality checks pass before production publish
- [ ] Store-level security restrictions are enforced

---

## Monitoring and Operations

### Pipeline Health

The `PipelineHealth` Dataverse table is the central health register for all data sync
pipelines. Every pipeline run writes a row with its status, record counts, error details,
and data quality results. The Power Analysis agent's Pipeline Health Check topic queries
this table and can report on feed health in response to questions such as:
"Are all data feeds healthy?" and "Which pipelines failed recently?"

For full operational runbook guidance on responding to pipeline failures, data quality
alerts, and SLA breaches, see `docs/data-sync-pipelines.md`.

### Agent and Automation Monitoring

| Task | Frequency | Owner |
|------|-----------|-------|
| Monitor pipeline health via PipelineHealth table and Teams alerts | Continuous | Data Engineering |
| Review PosDataSync failures and data quality results | Daily | Data Engineering |
| Review ErpDataSync delta failures and orphaned lookups | Daily | Data Engineering |
| Review AllocationDataSync snapshot completeness | Hourly | Data Engineering |
| Verify KPI cache freshness (CacheTimestamp within 4 hours) | Every 4 hours | Data Engineering |
| Monitor sync latency vs SLA thresholds | Hourly | Data Engineering |
| Review analytical flow failures | Daily | Automation Engineer |
| Validate KPI formulas after model changes | Each release | BI Lead |
| Review anomaly false positives | Weekly | Retail Analytics |
| Review unrecognized prompts and topic routing | Weekly | Copilot Studio Admin |
| Verify Dataverse Synapse Link export health | Daily | Data Platform Team |
| Verify Synapse Link export health | Daily | Data Platform Team |
| Review AlertRuleEvaluator execution and missed evaluations | Daily | Automation Engineer |
| Review duplicate suppression in AlertHistory | Weekly | Automation Engineer |
| Audit ScheduledReportDelivery success and failure rates | Daily | Automation Engineer |
| Review orphaned ScheduledReports with missing FlowRunId | Weekly | Copilot Studio Admin |

---

## Rollback Procedure

1. Unpublish the current agent version in Copilot Studio.
2. Re-import last known good solution package.
3. Rebind connection references and environment variables.
4. Re-run data quality validation and smoke tests.
5. Republish and communicate rollback status to stakeholders.
