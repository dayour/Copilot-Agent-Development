# Power Analysis — Clothing

A Copilot Studio business intelligence agent for large clothing retailers. It empowers managers and executives with conversational access to sales performance, inventory analytics, trend insights, and operational KPIs — turning raw data into actionable decisions without needing dedicated BI expertise.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Power Analysis |
| **Vertical** | Clothing |
| **Primary Users** | Store managers, regional directors, buying team, operations leads |
| **Channel** | Microsoft Teams, web chat |
| **Language** | English |

## Key Topics

- **Sales Performance** — daily, weekly, and monthly revenue vs. target breakdowns by store and category
- **Inventory Analysis** — stock-on-hand, sell-through rates, overstock and understock alerts
- **Trend Insights** — top-performing SKUs, emerging category trends, and seasonal pattern analysis
- **Customer Analytics** — footfall, conversion rate, average basket value, and loyalty programme engagement
- **Operational KPIs** — labour cost ratios, shrinkage reporting, and markdown optimisation

## Folder Structure

```
power-analysis/
├── README.md               ← this file
├── runbook.md              ← deployment & operations runbook
├── templates/
│   └── agent-template.yaml ← Copilot Studio topic/conversation template
└── solution/
    └── solution-definition.yaml ← Copilot Studio solution export definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and deployment steps.
2. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
3. Connect the Power BI semantic model and data source environment variables in the solution.
4. Customise topics in `templates/agent-template.yaml` to reference your KPI names and reporting periods.
5. Publish the agent to Microsoft Teams.
