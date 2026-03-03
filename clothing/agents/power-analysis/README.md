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

## Quick Start

1. Provision Dataverse schema and security as documented in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Copilot Studio solution-aware environment.
3. Configure sync pipelines for POS, ERP, and inventory snapshots.
4. Configure and validate the Power Automate analytical flows referenced by the agent template.
5. Publish to Teams or web channel and execute validation tests for decomposition and root-cause scenarios.
