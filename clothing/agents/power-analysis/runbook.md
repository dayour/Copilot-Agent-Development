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

Configure relationships:
1. `SalesTransactions.StoreId -> StoreMaster.StoreId` (N:1)
2. `SalesTransactions.ProductId -> ProductCatalog.ProductId` (N:1)
3. `InventorySnapshots.StoreId -> StoreMaster.StoreId` (N:1)
4. `InventorySnapshots.ProductId -> ProductCatalog.ProductId` (N:1)

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

### 7. Configure Data Quality Validation
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
2. Validate user context propagation into flow calls.
3. Publish to Teams and run controlled UAT with analyst and store manager personas.

---

## Post-Deployment Validation

- [ ] Sales Performance returns STR, GMROI, and WoC with correct formulas
- [ ] Root Cause Analysis executes topic chain and returns decomposed drivers
- [ ] Inventory Intelligence generates reorder actions from Weeks of Cover thresholds
- [ ] Trend Detection explains period-over-period movement and contributing dimensions
- [ ] What-If Analysis returns projected KPI changes with input assumptions
- [ ] Anomaly Alerts identify threshold breaches and notify designated channel
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

---

## Rollback Procedure

1. Unpublish the current agent version in Copilot Studio.
2. Re-import last known good solution package.
3. Rebind connection references and environment variables.
4. Re-run data quality validation and smoke tests.
5. Republish and communicate rollback status to stakeholders.
