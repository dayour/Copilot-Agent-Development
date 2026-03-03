# Analytics Dashboard - Coffee Virtual Coach

The Analytics Dashboard is a SharePoint-hosted reporting solution for the Virtual Coach agent. It provides Power BI reports embedded in SharePoint to surface conversation volume, topic trends, unresolved query rates, peak usage times, and employee adoption metrics across all coffee store locations.

## Solution Architecture

Data flows from the Copilot Studio analytics API through a Power Automate scheduled flow into a SharePoint list and a Dataverse table. Power BI reads from these sources and the embedded report is surfaced on a role-governed SharePoint site page.

```
Copilot Studio Analytics API
        |
        v
Power Automate Scheduled Flow (daily)
        |
        +--> SharePoint: AnalyticsData list (store-level snapshots)
        +--> Dataverse: VirtualCoachAnalytics table (long-term retention)
        |
        v
Power BI Semantic Model (DirectQuery + Import hybrid)
        |
        v
SharePoint Site Page: Virtual Coach Analytics
        |
        +--> Store Manager view  (filtered to single store)
        +--> Regional Director view (filtered to region)
        +--> Corporate view       (all stores, all regions)
```

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Analytics Dashboard |
| **Vertical** | Coffee |
| **Primary Users** | Store managers, regional directors, corporate analytics team |
| **Channels** | SharePoint site page (embedded Power BI), Microsoft Teams tab |
| **Language** | English |

## Power BI Report Pages

| Page | Metrics | Audience |
|------|---------|----------|
| Conversation Volume | Daily and weekly conversation counts by store and region | All roles |
| Topic Breakdown | Query distribution across Recipes, HR, Operations, Training, Menu, and other topics | All roles |
| Unresolved Queries | Unresolved query rate per topic with trend over time | All roles |
| Peak Usage | Hourly and day-of-week usage heatmap | All roles |
| Employee Adoption | Unique active users by role (Barista, Shift Lead, Store Manager) | Regional Director, Corporate |

## Role-Based Views

| Role | SharePoint Group | Data Scope | Filter Applied |
|------|-----------------|-----------|----------------|
| Store Manager | `VirtualCoach-Analytics-Store-{StoreNumber}` | Single store | `StoreNumber eq '{store}'` |
| Regional Director | `VirtualCoach-Analytics-Region-{Region}` | All stores in region | `Region eq '{region}'` |
| Corporate | `VirtualCoach-Analytics-Corporate` | All stores, all regions | None |

Row-level security (RLS) in the Power BI semantic model enforces these filters using the authenticated user's Entra ID group membership. The SharePoint site page audience targeting mirrors the same Entra ID groups so each role sees only the relevant report section.

## Key Metrics Definitions

| Metric | Definition |
|--------|-----------|
| Conversation Volume | Total conversation sessions initiated with Virtual Coach |
| Topic Query Count | Sessions routed to a named topic |
| Unresolved Query Rate | Sessions that ended without a grounded answer, expressed as a percentage of total sessions |
| Peak Usage Hour | Clock hour with highest session count in the reporting period |
| Employee Adoption Rate | Unique authenticated users divided by total eligible employees in the reporting scope |

## SharePoint Information Architecture

| List / Page | Purpose |
|-------------|---------|
| `AnalyticsData` list | Daily analytics snapshots written by the scheduled flow |
| `VirtualCoachAnalytics` Dataverse table | Long-term aggregated analytics for Power BI DirectQuery |
| `Virtual Coach Analytics` site page | SharePoint modern page hosting the embedded Power BI report |

## Folder Structure

```text
analytics-dashboard/
|-- README.md
|-- runbook.md
|-- templates/
|   |-- agent-template.yaml
`-- solution/
    `-- solution-definition.yaml
```

## Quick Start

1. Review `runbook.md` for SharePoint, Power BI, and Copilot Studio prerequisites.
2. Import `solution/solution-definition.yaml` into the target Power Platform environment.
3. Configure environment variables for the Copilot Studio environment ID, SharePoint site URLs, and Power BI workspace.
4. Activate the `SyncVirtualCoachAnalytics` flow and validate the first scheduled run.
5. Publish the Power BI report to the target workspace and embed it on the SharePoint analytics page.
6. Assign store managers, regional directors, and corporate users to the appropriate SharePoint permission groups.
