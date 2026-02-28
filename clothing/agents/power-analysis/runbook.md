# Runbook — Power Analysis (Clothing)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Power Analysis agent for the Clothing vertical. The agent provides conversational business intelligence by connecting to Power BI semantic models and operational data sources.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power BI Premium or Fabric | Required for semantic model API access |
| Power Automate | For data query flows and alert triggers |
| Azure AD | For authentication and row-level security pass-through |
| Dataverse environment | To store conversation logs and saved report snapshots |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region matches your data residency requirements.

### 2. Import the Solution
1. Go to **Solutions** → **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `PowerBiWorkspaceId` — GUID of your Power BI workspace
   - `PowerBiDatasetId` — GUID of the primary retail semantic model
   - `SalesDashboardReportId` — GUID of the sales performance report
   - `InventoryReportId` — GUID of the inventory analysis report
   - `AnalyticsTeamsChannelId` — Teams channel for automated KPI alerts
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Power BI Connection
1. Open the **QueryPowerBiMeasure** flow in Power Automate.
2. Sign in to the Power BI connector using a service account with at least **Viewer** access to the workspace.
3. Test the flow by querying a known measure (e.g., `[Total Sales This Week]`) and confirming the value is returned.
4. Verify that row-level security (RLS) is enforced by testing with a store-manager account that has restricted data access.

### 4. Configure Knowledge Sources
1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** → **Add knowledge source**.
3. Add the SharePoint library containing BI glossary documents, KPI definitions, and report guides.
4. Run a manual sync and confirm the glossary Q&A topic is populated.

### 5. Configure Authentication
1. In **Settings** → **Security** → **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Azure AD tenant.
3. Confirm that Power BI RLS propagates the signed-in user identity through the Power Automate connector.

### 6. Publish to Microsoft Teams
1. Navigate to **Channels** → **Microsoft Teams**.
2. Click **Turn on Teams**.
3. Submit for admin approval if required by your tenant policy.
4. Test by messaging the agent and asking for yesterday's sales figures.

---

## Post-Deployment Validation

- [ ] Agent responds to "Hello" with the welcome message
- [ ] Sales performance topic returns correct revenue figures from Power BI
- [ ] Inventory analysis topic returns current stock-on-hand and sell-through rates
- [ ] Trend insights topic identifies the top 5 performing SKUs for the current period
- [ ] KPI alert flow fires when a store misses its daily sales target
- [ ] Row-level security prevents store managers from viewing other stores' data
- [ ] Authentication restricts access to tenant employees

---

## Monitoring & Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review conversation analytics | Weekly | BI Manager |
| Validate KPI measure accuracy | After every data model change | BI Developer |
| Review unrecognised inputs report | Bi-weekly | Copilot Studio Admin |
| Refresh semantic model schedules | Check daily (automated) | IT Admin |
| Licence & usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| Incorrect KPI figures | BI Developer | Data Engineering Team |
| Power BI connectivity failure | IT Admin | Power BI Service Admin |
| RLS data leak concern | IT Admin | CISO / Data Protection Officer |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify affected managers and the BI team via the analytics Teams channel.
