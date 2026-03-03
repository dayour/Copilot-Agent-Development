# Runbook - Analytics Dashboard (Coffee Virtual Coach)

## Overview

This runbook covers deployment and ongoing operations for the Virtual Coach analytics reporting solution. The solution ingests Copilot Studio analytics data through a scheduled Power Automate flow, stores it in SharePoint and Dataverse, and surfaces it through an embedded Power BI report on a role-governed SharePoint site page.

## Prerequisites

### Platform Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licensing | SharePoint Online, Power BI Pro or Premium Per User for report authors and embedded viewers |
| Copilot Studio licensing | Environment with Virtual Coach agent deployed |
| Power Automate | Premium connector access for Copilot Studio analytics API calls |
| Dataverse environment | Solution-aware deployment for analytics table and ALM |
| Entra ID | Authenticated user claims used for role-based filtering in Power BI RLS |
| Power BI workspace | Workspace in the same tenant with at least Contributor rights for the deploying account |

### SharePoint Prerequisites

| Requirement | Details |
|-------------|---------|
| Analytics SharePoint site | Dedicated site for analytics data and the dashboard page |
| `AnalyticsData` list | SharePoint list to receive daily snapshot records from the flow |
| Site page | Modern SharePoint page with the Power BI web part |
| Permission groups | Entra ID groups for Store, Region, and Corporate access tiers |
| Audience targeting | Modern page audience targeting enabled on the SharePoint site |

### Copilot Studio Prerequisites

| Requirement | Details |
|-------------|---------|
| Analytics API access | Copilot Studio environment ID and service account with Environment Maker or System Administrator role |
| Virtual Coach agent ID | Agent identifier used in analytics API queries |

## Deployment Steps

### 1. Provision the Analytics SharePoint Site

1. Create a new SharePoint communication site named `Virtual Coach Analytics`.
2. Note the site URL for use in environment variables.
3. Enable audience targeting under **Site settings > Pages**.

### 2. Create the AnalyticsData SharePoint List

Create a SharePoint list named `AnalyticsData` with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| Title | Single line of text | Auto-populated snapshot identifier |
| SnapshotDate | Date and Time | Date of the analytics snapshot |
| StoreNumber | Single line of text | Store identifier |
| Region | Single line of text | Regional grouping |
| ConversationCount | Number | Total conversation sessions for the period |
| TopicName | Single line of text | Topic name (Recipes, HR, Operations, etc.) |
| TopicQueryCount | Number | Sessions routed to this topic |
| UnresolvedCount | Number | Sessions without a grounded answer |
| PeakUsageHour | Number | Hour of day (0-23) with highest session count |
| UniqueUsers | Number | Distinct authenticated users for the period |
| UserRole | Single line of text | Employee role category |

### 3. Provision the Dataverse Analytics Table

1. In the Power Platform admin center, open the target Dataverse environment.
2. Create a custom table named `VirtualCoachAnalytics` using the schema defined in the solution definition.
3. Set the table ownership to Organization for shared read access.
4. Grant the analytics service account Create and Read permissions.

### 4. Import the Solution

1. Open **Solutions** in Power Apps maker portal.
2. Select **Import solution** and upload `solution/solution-definition.yaml`.
3. Populate all environment variables:

| Variable | Value |
|----------|-------|
| `CopilotStudioEnvironmentId` | Target Dataverse environment GUID |
| `VirtualCoachAgentId` | Agent identifier from Copilot Studio |
| `AnalyticsSiteUrl` | SharePoint analytics site URL |
| `AnalyticsListUrl` | Full URL of the `AnalyticsData` SharePoint list |
| `PowerBiWorkspaceId` | Power BI workspace GUID |
| `PowerBiReportId` | Power BI report GUID (populated after report publish) |
| `CorporateGroupId` | Entra ID object ID for the Corporate analytics group |
| `RegionGroupPrefix` | Prefix used to identify regional Entra ID groups |
| `StoreGroupPrefix` | Prefix used to identify store-level Entra ID groups |

4. Confirm all flows, connections, and components import without errors.

### 5. Configure the SyncVirtualCoachAnalytics Flow

1. Open the `SyncVirtualCoachAnalytics` flow in Power Automate.
2. Bind the Copilot Studio analytics connector with the service account credentials.
3. Bind the SharePoint connector to the analytics site.
4. Bind the Dataverse connector to the target environment.
5. Set the recurrence schedule to daily at 02:00 UTC.
6. Run the flow manually and verify records appear in the `AnalyticsData` SharePoint list and the `VirtualCoachAnalytics` Dataverse table.

### 6. Publish and Configure the Power BI Report

1. Open Power BI Desktop and connect to the `VirtualCoachAnalytics` Dataverse table and the `AnalyticsData` SharePoint list.
2. Build or import the report with the following pages: Conversation Volume, Topic Breakdown, Unresolved Queries, Peak Usage, Employee Adoption.
3. Configure row-level security (RLS) roles:
   - **StoreRole**: `[StoreNumber] = USERPRINCIPALNAME()` resolved through the store group mapping table.
   - **RegionRole**: `[Region] = LOOKUPVALUE(RegionMap[Region], RegionMap[UPN], USERPRINCIPALNAME())`.
   - **CorporateRole**: No filter (all data visible).
4. Publish the report to the target Power BI workspace.
5. Note the Report ID and update the `PowerBiReportId` environment variable.
6. In the Power BI service, assign Entra ID groups to RLS roles:
   - Corporate group to **CorporateRole**.
   - Each regional Entra ID group to **RegionRole**.
   - Each store Entra ID group to **StoreRole**.

### 7. Create the SharePoint Analytics Dashboard Page

1. Open the `Virtual Coach Analytics` SharePoint site.
2. Create a new modern page named `Virtual Coach Analytics Dashboard`.
3. Add the **Power BI** web part and select the published report.
4. Configure audience targeting on page sections:
   - Store-level section: target store Entra ID groups.
   - Region-level section: target regional Entra ID groups.
   - Corporate section: target corporate Entra ID group.
5. Publish the page.

### 8. Configure Teams Tab (Optional)

1. In the Virtual Coach Teams channel, add a new tab.
2. Select **Website** or **Power BI** tab type.
3. Point to the SharePoint analytics page URL or the Power BI report URL.
4. Restrict the tab visibility to store managers, regional directors, and corporate users.

### 9. Provision Entra ID Groups

For each store, create a group named `VirtualCoach-Analytics-Store-{StoreNumber}`.
For each region, create a group named `VirtualCoach-Analytics-Region-{Region}`.
Create a single group named `VirtualCoach-Analytics-Corporate`.

Assign users to the appropriate groups based on their role:

| Role | Group |
|------|-------|
| Store Manager | `VirtualCoach-Analytics-Store-{StoreNumber}` |
| Regional Director | `VirtualCoach-Analytics-Region-{Region}` |
| Corporate Analytics | `VirtualCoach-Analytics-Corporate` |

## Post-Deployment Validation

- [ ] `SyncVirtualCoachAnalytics` flow runs on schedule and completes without errors.
- [ ] `AnalyticsData` SharePoint list receives new records after each flow run.
- [ ] `VirtualCoachAnalytics` Dataverse table receives corresponding records.
- [ ] Power BI report refreshes and all five pages load without data errors.
- [ ] Store manager user sees only their store data in the report.
- [ ] Regional director user sees only stores in their region.
- [ ] Corporate user sees all stores and regions.
- [ ] SharePoint analytics page loads correctly in a browser and in Teams.
- [ ] Audience targeting hides irrelevant sections for each role.

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review `SyncVirtualCoachAnalytics` flow run history for failures | Daily | Power Platform Admin |
| Validate record counts in `AnalyticsData` list and Dataverse table | Weekly | Power Platform Admin |
| Review unresolved query rate trends and flag high-rate topics | Weekly | Copilot Studio Admin |
| Refresh Power BI report and validate data currency | Daily (automated) | Power BI Dataset Owner |
| Review and update Entra ID group membership for role changes | As needed | Entra ID Admin |
| Review peak usage trends and plan capacity | Monthly | Regional Operations Lead |

## Rollback Procedure

1. Deactivate the `SyncVirtualCoachAnalytics` flow to stop new data writes.
2. Unpublish the SharePoint analytics page.
3. Restore the previous solution package from source control.
4. Re-import and rebind connections.
5. Re-activate the flow after validation.
6. Republish the SharePoint page.
7. Notify store managers and regional directors of the maintenance window.

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|-------------|-----------|
| Flow fails with 401 error | Copilot Studio analytics connector credentials expired | Reauthorize the analytics connector in Power Automate |
| No new records in `AnalyticsData` list | Flow run skipped or SharePoint connector disconnected | Check flow run history and rebind SharePoint connection |
| Power BI report shows no data | Dataverse connection expired or semantic model refresh failed | Refresh the semantic model and check gateway health |
| User sees data outside their scope | RLS role assignment missing or incorrect group mapping | Verify Power BI RLS group assignments and Entra ID group membership |
| SharePoint page not visible to user | Audience targeting group assignment missing | Add user to the correct Entra ID group and verify audience targeting config |
