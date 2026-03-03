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

Required column guidance:
- `SalesTransactions`: TransactionId (alternate key), StoreId (lookup), ProductId (lookup), TransactionDate, UnitsSold, NetSalesAmount, GrossMarginAmount, Channel
- `ProductCatalog`: ProductId (alternate key), SKU, Brand, Category, SubCategory, Season, StandardCost
- `StoreMaster`: StoreId (alternate key), StoreName, Region, Country, Format, Cluster
- `InventorySnapshots`: SnapshotId (alternate key), SnapshotDate, StoreId (lookup), ProductId (lookup), UnitsOnHand, UnitsReceived, InventoryCost, AvgWeeklySales, WeeksCover (calculated), ReorderPoint
- `AlertRules`: AlertRuleId (alternate key), RuleName, Metric, Operator (choice), Threshold (decimal), ThresholdUnit, Scope (choice: store/region/category/enterprise), ScopeValue, CompoundLogic (choice: none/AND/OR), SecondaryMetric, SecondaryOperator, SecondaryThreshold, EvaluationFrequency (choice: real_time/hourly/daily/weekly), Owner, OwnerEntraId, IsActive (boolean, default true), CreatedOn, ModifiedOn
- `AlertHistory`: AlertHistoryId (alternate key), AlertRuleId (lookup to AlertRules), TriggeredAt, MetricValue (decimal), ThresholdValue (decimal), Scope, ScopeValue, Status (choice: new/acknowledged/resolved, default new), AcknowledgedBy, AcknowledgedAt, ResolvedAt, ResolutionNotes
- `SavedAnalyses`: SavedAnalysisId (alternate key), AnalysisName, QueryParameters (multiline text), ResultSnapshot (multiline text), GeneratedInsights (multiline text), AnalysisType (choice: sales_performance/root_cause/inventory/trend/what_if/anomaly), SavedAt, Owner, OwnerEntraId, SharedWith (multiline text), IsShared (boolean, default false)
- `ScheduledReports`: ScheduledReportId (alternate key), ReportName, CronSchedule, HumanReadableSchedule, QueryDefinition (multiline text), Recipients (multiline text), OutputFormat (choice: teams/email/pdf, default email), FlowRunId, Owner, OwnerEntraId, IsActive (boolean, default true), CreatedOn, LastRunAt, NextRunAt

Configure relationships:
1. `SalesTransactions.StoreId -> StoreMaster.StoreId` (N:1)
2. `SalesTransactions.ProductId -> ProductCatalog.ProductId` (N:1)
3. `InventorySnapshots.StoreId -> StoreMaster.StoreId` (N:1)
4. `InventorySnapshots.ProductId -> ProductCatalog.ProductId` (N:1)
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
   - `ScheduledReportsTeamsChannelId`
   - `ReportDefaultRecipients`
   - `PosApiBaseUrl`
   - `ErpApiBaseUrl`
   - `AllocationApiBaseUrl`
4. Verify imported components are healthy and connection references are bound.

### 5. Configure Data Pipeline Sync
Set up inbound pipelines:

1. **POS Sync (15-minute micro-batch)**
   - Source: POS API / event stream
   - Target: `SalesTransactions`
   - Strategy: Upsert by TransactionId

2. **ERP Sync (hourly batch)**
   - Source: ERP product and financial data
   - Target: `ProductCatalog`, inventory cost fields
   - Strategy: Upsert by ProductId and effective dates

3. **Inventory Snapshot Sync (daily and intraday checkpoints)**
   - Source: Allocation/inventory planning system
   - Target: `InventorySnapshots`
   - Strategy: Append by SnapshotDate, StoreId, ProductId

4. **Store Master Sync (daily)**
   - Source: Retail master data
   - Target: `StoreMaster`
   - Strategy: Slowly changing dimensions with effective dating

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
2. Select `SalesTransactions`, `InventorySnapshots`, and supporting dimensions.
3. Configure export to ADLS Gen2 and attach Synapse workspace.
4. Build historical analytical views (multi-year trend and seasonality).
5. Route long-window queries and heavy aggregations to Synapse-backed datasets.

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

| Task | Frequency | Owner |
|------|-----------|-------|
| Monitor sync latency and failures | Hourly | Data Engineering |
| Review analytical flow failures | Daily | Automation Engineer |
| Validate KPI formulas after model changes | Each release | BI Lead |
| Review anomaly false positives | Weekly | Retail Analytics |
| Review unrecognized prompts and topic routing | Weekly | Copilot Studio Admin |
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
