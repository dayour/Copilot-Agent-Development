# Data Sync Pipelines — Power Analysis Agent (Clothing Retail)

## Overview

This document defines the batch data synchronization pipelines that keep the Dataverse
operational data fabric current for the Power Analysis agent. Four pipelines ingest data
from Point of Sale (POS), ERP, and allocation source systems into Dataverse, and a fifth
pipeline pre-calculates KPIs from the Power BI semantic model into a fast-read KPI cache.

All pipelines are implemented as Power Automate cloud flows. Each run writes a row to the
`PipelineHealth` table so the agent and operations teams can monitor feed freshness and
surface failures using the Pipeline Health Check topic.

---

## Pipeline Summary

| Pipeline | Source | Frequency | Method | Target Tables | Estimated Volume |
|---|---|---|---|---|---|
| PosDataSync | POS API | Daily (02:00 UTC) | Incremental (change tracking) | SalesTransactions, BasketDetails, TenderMix | 500K to 1M transactions per day |
| ErpDataSync | ERP API | Daily (03:00 UTC) | Delta (modified date) | ProductCatalog, PurchaseOrders | 10K product updates, 5K PO lines per day |
| AllocationDataSync | Allocation API | Hourly | Full snapshot (inventory), incremental (movements) | InventorySnapshots, StockMovements, TransferOrders | 200K inventory records per snapshot |
| KpiCacheRefresh | Power BI | Every 4 hours | Scheduled semantic model query | KpiCache | Store scorecards, category performance, regional summaries |
| DataQualityValidation | Dataverse | After each sync | Validation rules engine | PipelineHealth (results) | Runs inline after each pipeline |

---

## Pipeline 1: POS to Dataverse

### Purpose

Ingests daily sales transactions, basket line items, and tender mix from the POS system
into Dataverse to enable transaction-level sales analysis, sell-through calculation, and
tender mix reporting.

### Frequency and Schedule

Daily batch sync at 02:00 UTC. The run window is sized to complete before the business
day reporting cycle begins at 06:00 UTC.

### Data and Lineage

```
POS System
  --> PosConnector.GetTransactions (delta since PosSyncLastSuccessfulTimestamp)
      --> SalesTransactions (upsert by SalesTransactionId)
  --> PosConnector.GetBasketDetails (for transaction IDs in current batch)
      --> BasketDetails (upsert by BasketDetailId)
  --> PosConnector.GetTenderMix (for transaction IDs in current batch)
      --> TenderMix (upsert by TenderMixId)
  --> DataQualityValidation (inline check)
  --> PipelineHealth (write run outcome)
  --> PipelineHealthAlert (if failure)
```

### Transformation Logic

| Source Field | Target Table | Target Column | Transformation |
|---|---|---|---|
| pos_txn_id | SalesTransactions | SalesTransactionId | Direct map; used as upsert key |
| store_code | SalesTransactions | StoreId | Lookup resolve against StoreMaster.StoreId |
| product_code | SalesTransactions | ProductId | Lookup resolve against ProductCatalog.ProductId |
| txn_datetime_utc | SalesTransactions | TransactionDate | UTC datetime; no conversion needed |
| qty_sold | SalesTransactions | UnitsSold | Decimal; null replaced with 0 |
| net_revenue | SalesTransactions | NetSalesAmount | Currency; null replaced with 0 |
| gross_margin | SalesTransactions | GrossMarginAmount | Currency; negative values permitted (markdowns) |
| channel_code | SalesTransactions | Channel | Map to: Store, Ecommerce, Outlet, Marketplace |
| discount_amt | SalesTransactions | DiscountAmount | Currency; null replaced with 0 |
| basket_line_no | BasketDetails | LineNumber | Integer; sequence within transaction |
| tender_type_code | TenderMix | TenderType | Map to: Cash, Card, Digital Wallet, Gift Card, Loyalty Points |

### Incremental Strategy

The pipeline uses a watermark timestamp stored in the environment variable
`PosSyncLastSuccessfulTimestamp`. The value must be in ISO 8601 UTC format
(for example `2025-01-01T00:00:00Z`). On each successful run, this variable is updated to
the latest `TransactionTimestamp` value processed. On the next run, only records with
`TransactionTimestamp > PosSyncLastSuccessfulTimestamp` are fetched from the POS API.

If a run fails before completing, the watermark is not updated. The next retry re-fetches
from the last successful watermark, ensuring no data is lost.

### Data Quality Checks

| Check | Rule |
|---|---|
| Null detection | SalesTransactionId, StoreId, ProductId, TransactionDate, UnitsSold, NetSalesAmount must not be null |
| Range validation | UnitsSold >= 0; NetSalesAmount >= 0 |
| Referential integrity | SalesTransactions.StoreId must exist in StoreMaster; SalesTransactions.ProductId must exist in ProductCatalog |
| Uniqueness | SalesTransactionId must be unique within the batch and across Dataverse |
| Reconciliation | Daily POS totals (sum of NetSalesAmount by store and date) must match Power BI semantic model totals within 0.01% |

---

## Pipeline 2: ERP to Dataverse

### Purpose

Ingests product catalog updates, cost price changes, and purchase order lines from the ERP
system into Dataverse to keep product attributes, standard costs, and open-to-buy data
current for analytical queries.

### Frequency and Schedule

Daily delta sync at 03:00 UTC. The run window is sized to complete before the business
day reporting cycle begins at 07:00 UTC.

### Data and Lineage

```
ERP System
  --> ErpConnector.GetProductUpdates (delta since ErpSyncLastSuccessfulTimestamp)
      --> ProductCatalog (upsert by ProductId)
  --> ErpConnector.GetPurchaseOrders (delta since ErpSyncLastSuccessfulTimestamp)
      --> PurchaseOrders (upsert by PurchaseOrderId)
  --> DataQualityValidation (inline check)
  --> PipelineHealth (write run outcome)
  --> PipelineHealthAlert (if failure)
```

### Transformation Logic

| Source Field | Target Table | Target Column | Transformation |
|---|---|---|---|
| erp_product_id | ProductCatalog | ProductId | Direct map; upsert key |
| erp_sku | ProductCatalog | SKU | Direct map |
| brand_name | ProductCatalog | Brand | Direct map |
| category_name | ProductCatalog | Category | Standardize to canonical category list |
| sub_category_name | ProductCatalog | SubCategory | Direct map |
| season_code | ProductCatalog | Season | Map to format: SS25, AW25, etc. |
| lifecycle_status | ProductCatalog | LifecycleStatus | Map to: Active, Clearance, Discontinued, Incoming |
| standard_cost_local | ProductCatalog | StandardCost | Convert to base currency using exchange rate lookup |
| po_number | PurchaseOrders | PurchaseOrderId | Direct map; upsert key |
| erp_product_id | PurchaseOrders | ProductId | Lookup resolve against ProductCatalog.ProductId |
| delivery_store_code | PurchaseOrders | StoreId | Lookup resolve against StoreMaster.StoreId; null for DC deliveries |
| order_date | PurchaseOrders | OrderDate | Date; strip time component |
| expected_delivery | PurchaseOrders | ExpectedDeliveryDate | Date; strip time component |
| ordered_qty | PurchaseOrders | OrderedQuantity | Decimal; null replaced with 0 |
| received_qty | PurchaseOrders | ReceivedQuantity | Decimal; null replaced with 0 |
| unit_cost_local | PurchaseOrders | UnitCost | Convert to base currency |
| po_status_code | PurchaseOrders | POStatus | Map to: Open, Partially Received, Closed, Cancelled |
| supplier_id | PurchaseOrders | SupplierCode | Direct map |
| erp_modified_datetime | PurchaseOrders | ModifiedDate | UTC datetime; used as delta watermark |

### Delta Sync Strategy

The pipeline uses the `ModifiedDate` field in both the ERP product and PO feeds as the
delta filter. Records where `ModifiedDate > ErpSyncLastSuccessfulTimestamp` are fetched.
The watermark is updated only after a fully successful run.

### Data Quality Checks

| Check | Rule |
|---|---|
| Null detection | ProductId, SKU, Brand, Category, StandardCost must not be null |
| Range validation | StandardCost >= 0; OrderedQuantity >= 0; UnitCost >= 0 |
| Referential integrity | PurchaseOrders.ProductId must exist in ProductCatalog; PurchaseOrders.StoreId must exist in StoreMaster (when not null) |
| Uniqueness | ProductCatalog.ProductId must be unique; PurchaseOrders.PurchaseOrderId must be unique |

---

## Pipeline 3: Allocation to Dataverse

### Purpose

Ingests inventory position snapshots, stock movements, and transfer orders from the
allocation/inventory planning system into Dataverse to support stock risk analysis,
weeks-of-cover calculations, reorder recommendations, and transfer visibility.

### Frequency and Schedule

Runs hourly. Full snapshot for `InventorySnapshots`; incremental load for
`StockMovements` and `TransferOrders`.

### Data and Lineage

```
Allocation System
  --> AllocationConnector.GetInventorySnapshot (full snapshot for current date)
      --> InventorySnapshots (upsert by composite key: SnapshotDate + StoreId + ProductId)
  --> AllocationConnector.GetStockMovements (delta since AllocationSyncLastSuccessfulTimestamp)
      --> StockMovements (upsert by StockMovementId)
  --> AllocationConnector.GetTransferOrders (delta since AllocationSyncLastSuccessfulTimestamp)
      --> TransferOrders (upsert by TransferOrderId)
  --> DataQualityValidation (inline check)
  --> PipelineHealth (write run outcome)
  --> PipelineHealthAlert (if failure)
```

### Transformation Logic

| Source Field | Target Table | Target Column | Transformation |
|---|---|---|---|
| snapshot_id | InventorySnapshots | SnapshotId | Generate as hash(SnapshotDate + StoreId + ProductId) if not provided |
| snapshot_date | InventorySnapshots | SnapshotDate | UTC datetime at snapshot capture time |
| store_code | InventorySnapshots | StoreId | Lookup resolve against StoreMaster.StoreId |
| product_code | InventorySnapshots | ProductId | Lookup resolve against ProductCatalog.ProductId |
| on_hand_units | InventorySnapshots | UnitsOnHand | Decimal; null replaced with 0 |
| received_units_wtd | InventorySnapshots | UnitsReceived | Decimal; week-to-date received units |
| inventory_cost | InventorySnapshots | InventoryCost | Currency; cost at standard cost |
| avg_weekly_sales | InventorySnapshots | AvgWeeklySales | Decimal; rolling 8-week average from allocation system |
| reorder_point | InventorySnapshots | ReorderPoint | Decimal; directly from allocation system |
| movement_id | StockMovements | StockMovementId | Direct map; upsert key |
| movement_type_code | StockMovements | MovementType | Map to: Sale, Return, Transfer In, Transfer Out, Adjustment, Write-Off |
| qty_delta | StockMovements | QuantityChange | Decimal; positive for inbound, negative for outbound |
| source_ref_id | StockMovements | ReferenceId | TransactionId, TransferOrderId, or AdjustmentId |
| posted_utc | StockMovements | PostedTimestamp | UTC datetime; used as incremental watermark |
| transfer_order_id | TransferOrders | TransferOrderId | Direct map; upsert key |
| transfer_status | TransferOrders | TransferStatus | Map to: Requested, Approved, In Transit, Received, Cancelled |

### Sync Strategy

- `InventorySnapshots`: Full snapshot upsert each hour. The composite key
  `(SnapshotDate, StoreId, ProductId)` determines insert vs update. Older snapshots are
  preserved for historical trend analysis.
- `StockMovements`: Incremental load using `PostedTimestamp` watermark stored in
  `AllocationSyncLastSuccessfulTimestamp`.
- `TransferOrders`: Incremental load using `ModifiedTimestamp` watermark to capture
  status changes on in-flight transfers.

### Data Quality Checks

| Check | Rule |
|---|---|
| Null detection | SnapshotId, SnapshotDate, StoreId, ProductId, UnitsOnHand must not be null |
| Range validation | UnitsOnHand >= 0; InventoryCost >= 0; WeeksCover in range 0 to 52 |
| Referential integrity | InventorySnapshots.StoreId in StoreMaster; InventorySnapshots.ProductId in ProductCatalog; StockMovements.StoreId in StoreMaster; StockMovements.ProductId in ProductCatalog |
| Uniqueness | InventorySnapshots composite key (SnapshotDate + StoreId + ProductId) must be unique per run |

---

## Pipeline 4: Power BI to Dataverse (KPI Cache)

### Purpose

Pre-calculates and caches common KPIs from the Power BI semantic model into the Dataverse
`KpiCache` table. This avoids real-time DAX query execution for routine agent queries,
reducing latency and semantic model load.

### Frequency and Schedule

Refreshes every 4 hours. Cache rows are tagged with a `CacheTimestamp` so the agent can
report data freshness.

### Cached Metrics and Grains

| Grain | Dimensions | Metrics | Periods |
|---|---|---|---|
| StoreScorecard | StoreId | SellThroughRatePct, GmroiValue, WeeksCoverValue, StockTurnValue, NetSalesAmount, GrossMarginPct, OpenToBuyValue | Current week, current month, quarter to date |
| CategoryPerformance | CategoryCode | SellThroughRatePct, GmroiValue, WeeksCoverValue, NetSalesAmount, GrossMarginPct | Current week, current month |
| RegionalSummary | RegionCode | NetSalesAmount, GrossMarginPct, SellThroughRatePct, UnitsOnHand | Current week, current month, quarter to date |

### Data Lineage

```
Power BI Semantic Model (ClothingRetailModel)
  --> KpiCacheRefresh flow (DAX query via Power BI Execute Queries API)
      --> KpiCache (upsert by KpiCacheId = hash(GrainType + DimensionKey + PeriodKey + CacheTimestamp))
  --> PipelineHealth (write run outcome)
  --> PipelineHealthAlert (if failure)
```

### Cache Invalidation

Cache rows are not deleted on refresh. Each refresh inserts new rows with a new
`CacheTimestamp`. The agent template's KPI queries filter on
`CacheTimestamp = max(CacheTimestamp)` to read only the most recent cache set.
Rows older than 48 hours are purged by a scheduled bulk delete job.

---

## Error Handling and Retry Logic

All four sync pipelines implement exponential backoff retry within the Power Automate flow.

### Retry Configuration

| Parameter | PosDataSync | ErpDataSync | AllocationDataSync | KpiCacheRefresh |
|---|---|---|---|---|
| Max retries | 3 | 3 | 3 | 3 |
| Total attempts | 4 | 4 | 4 | 4 |
| Initial delay | 30 seconds | 30 seconds | 30 seconds | 60 seconds |
| Backoff multiplier | 2 | 2 | 2 | 2 |
| Max delay | 240 seconds | 240 seconds | 240 seconds | 480 seconds |

### Retry Timing (POS, ERP, Allocation)

Attempt 1 (initial): immediate
Attempt 2 (retry 1): after 30 seconds
Attempt 3 (retry 2): after 60 seconds
Attempt 4 (retry 3): after 120 seconds

### Retry Timing (KPI Cache)

Attempt 1 (initial): immediate
Attempt 2 (retry 1): after 60 seconds
Attempt 3 (retry 2): after 120 seconds
Attempt 4 (retry 3): after 240 seconds

After all retries are exhausted, the flow writes a `Failed` status row to `PipelineHealth`
and triggers the `PipelineHealthAlert` flow to post a notification to the pipeline alert
Teams channel.

### Partial Failure Handling

For batch pipelines that process records in pages, if a page fails after all retries,
the flow writes a `PartialFailure` status, records the number of failed records and the
error details in `PipelineHealth`, and continues processing subsequent pages. This ensures
a single bad page does not block the entire batch.

### Watermark Safety

Watermark timestamps (`PosSyncLastSuccessfulTimestamp`, `ErpSyncLastSuccessfulTimestamp`,
`AllocationSyncLastSuccessfulTimestamp`) are updated only after a full run completes with
status `Succeeded`. A `PartialFailure` or `Failed` run leaves the watermark unchanged,
causing the next attempt to re-process the same window and catch any missed records.

---

## Data Quality Validation Flow

The `DataQualityValidation` flow runs inline at the end of each sync pipeline before the
watermark is updated. It executes four categories of checks.

### Check Categories

**Null Detection**
Queries each target table for rows where required columns are null. Required columns are
defined per table in the pipeline configuration in `solution-definition.yaml`.

**Range Validation**
Validates numeric columns against defined min and max bounds. Flags rows that violate
bounds but does not reject them by default unless the violation rate exceeds 1% of the
batch, at which point the run status is set to `PartialFailure`.

**Uniqueness Checks**
Validates primary keys and composite keys for duplicates within the batch and against
existing Dataverse rows. Duplicate rows are logged and skipped; the run continues.

**Referential Integrity Checks**
Validates lookup column values against referenced dimension tables. Orphaned rows (where
the referenced record does not exist) are logged in `PipelineHealth.DataQualityFailureDetails`
and flagged for manual resolution.

**Reconciliation (POS only)**
After each POS batch, the total daily net sales amount per store is compared against the
Power BI semantic model aggregate for the same date and store. A discrepancy greater than
0.01% raises a `PartialFailure` status and posts an alert.

---

## PipelineHealth Table

Every pipeline run writes one or more rows to the `PipelineHealth` Dataverse table so
that operations teams and the Power Analysis agent can monitor data feed health.

### Schema Reference

See `solution/solution-definition.yaml` under `dataverse_tables.PipelineHealth` for the
full column definition.

### Key Columns

| Column | Purpose |
|---|---|
| PipelineName | Identifies the pipeline (PosDataSync, ErpDataSync, AllocationDataSync, KpiCacheRefresh) |
| RunStatus | Succeeded, Failed, PartialFailure, Running, Skipped |
| RunStartTimestamp | UTC start time |
| RunEndTimestamp | UTC end time; null if still running |
| RecordsProcessed | Count of records successfully written in this run |
| RecordsFailed | Count of records that could not be written after retries |
| ErrorCode | Source system or connector error code, if applicable |
| ErrorMessage | Truncated error description |
| RetryAttempt | 0 for initial attempt; increments per retry |
| DataQualityChecksPassed | True if all critical quality checks passed |
| DataQualityFailureDetails | JSON summary of failed checks |
| SourceSystemTimestamp | Watermark used for this run |
| CorrelationId | Power Automate flow run ID for end-to-end trace |

### Agent Query Pattern

The Pipeline Health Check topic queries this table using a filter on `RunStartTimestamp`
within the last N hours (configurable, default 24). It groups results by `PipelineName`
and reports the most recent run status per pipeline.

---

## Monitoring and Alerting

### Pipeline Alert Flow

The `PipelineHealthAlert` flow is triggered by a Dataverse row-created event on
`PipelineHealth` where `RunStatus` is `Failed` or `PartialFailure`. It posts a structured
alert to the Teams channel identified by `PipelineAlertTeamsChannelId`.

### Alert Content

- Pipeline name and status
- Run start and end timestamps
- Records processed and failed
- Error code and message
- Retry attempt number
- Data quality failure summary (if applicable)
- Link to Power Automate run history for the correlation ID

### SLA Thresholds

| Pipeline | Completion SLA |
|---|---|
| PosDataSync | Complete by 06:00 UTC (daily) |
| ErpDataSync | Complete by 07:00 UTC (daily) |
| AllocationDataSync | Complete within 30 minutes of each hourly trigger |
| KpiCacheRefresh | Complete within 45 minutes of each 4-hour trigger |

An SLA breach alert is posted if the `RunEndTimestamp` is null and the current time
exceeds the SLA window.

### Operational Runbook

**Pipeline failed after all retries**
1. Open the pipeline alert in Teams.
2. Use the CorrelationId to find the Power Automate flow run in the portal.
3. Identify the failing step and review the error code and message.
4. Check source system health using the connector probe endpoint (`/health`).
5. If the source system is available, re-trigger the pipeline manually. The watermark
   will re-process from the last successful timestamp.
6. If the source system is unavailable, notify the data engineering team and update the
   PipelineHealth row status to Skipped once the outage is resolved.

**Data quality check failed**
1. Review `DataQualityFailureDetails` in the PipelineHealth row.
2. Identify the check type: null detection, range validation, uniqueness, or referential integrity.
3. For referential integrity failures, check whether the referenced dimension record is
   missing from StoreMaster or ProductCatalog and provision it if needed.
4. For range violations exceeding 1% of batch, investigate the source system for data
   quality issues before re-running.
5. For uniqueness violations, identify the duplicate source record and resolve it in the
   source system.

**KPI cache stale**
1. Check the most recent `KpiCacheRefresh` run in PipelineHealth.
2. If the last successful run is more than 8 hours ago, manually trigger the
   `KpiCacheRefresh` flow.
3. Verify the Power BI workspace and dataset IDs are correct in environment variables.
4. Check Power BI service health if the refresh is still failing.

---

## Dataverse Synapse Link

The following tables are exported to ADLS Gen2 via Dataverse Synapse Link for historical
and high-volume analytical workloads (2+ years of transactions):

- SalesTransactions
- BasketDetails
- TenderMix
- InventorySnapshots
- StockMovements
- PurchaseOrders
- ProductCatalog
- StoreMaster

The Synapse Link uses incremental export mode. Historical queries, multi-year trend
analysis, and seasonality modeling are routed to Synapse-backed datasets rather than
querying Dataverse directly. The agent routes long-window analytical queries (more than
13 months) through the Power Automate `TrendAnalysis` flow, which targets the Synapse
workspace rather than the Dataverse connector.

See `runbook.md` section 8 for Synapse Link provisioning steps.

---

## Folder Structure

```
power-analysis/
├── README.md
├── runbook.md
├── docs/
│   └── data-sync-pipelines.md   (this file)
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```
