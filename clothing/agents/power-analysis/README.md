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

## Analytical Reasoning Patterns

- **Decomposition reasoning**: Breaks high-level questions into sub-queries (sales trend, inventory pressure, brand/category mix, labor impact, and exogenous factors).
- **Comparative reasoning**: Performs store-to-store, period-over-period, and peer-cluster comparisons.
- **Predictive reasoning**: Runs what-if scenarios and projected impact calculations using adjustable assumptions.
- **Anomaly detection reasoning**: Identifies unusual KPI shifts and attributes likely contributors.

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

## Quick Start

1. Provision Dataverse schema and security as documented in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Copilot Studio solution-aware environment.
3. Configure sync pipelines for POS, ERP, and inventory snapshots.
4. Configure and validate the Power Automate analytical flows referenced by the agent template.
5. Publish to Teams or web channel and execute validation tests for decomposition and root-cause scenarios.
