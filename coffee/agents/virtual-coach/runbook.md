# Runbook - Virtual Coach (Coffee)

## Overview

This runbook defines deployment and operations for the Virtual Coach Copilot Studio agent using SharePoint Online as the primary enterprise content system.

## Prerequisites

### Platform Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licensing | Teams, SharePoint Online, and Power Platform entitlements |
| Copilot Studio licensing | Capacity aligned to expected store volume |
| Power Automate | Required for list writeback, notifications, and approvals |
| Dataverse environment | Solution-aware deployment and ALM |
| Entra ID | Authentication and role-based access |

### SharePoint Prerequisites

| Requirement | Details |
|-------------|---------|
| Hub architecture | Corporate Root Hub, Regional Hubs, and Store Sites provisioned |
| Managed metadata term sets | DrinkCategory, PolicyType, StoreRegion, JobRole |
| Content types | Recipe, HrPolicy, TrainingGuide, OperationsGuide, SeasonalMenuItem, ShiftHandoverRecord |
| Libraries and lists | `recipes-library`, `hr-policy-library`, `training-library`, `operations-library`, `seasonal-menu-library`, `shift-handover-list`, `store-directory-list` |
| Search readiness | Crawled properties mapped to managed properties for metadata fields used in knowledge retrieval |
| Governance controls | Versioning, content approval, and mandatory metadata enforced |

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Go to https://copilotstudio.microsoft.com.
2. Select or create the target Dataverse environment.
3. Confirm region and data residency settings.

### 2. Provision SharePoint Information Architecture
1. Create or validate the Corporate Root Hub.
2. Create Regional Hub sites and associate Store Sites to the correct regional hub.
3. Create required document libraries and lists on the appropriate hub or associated sites.
4. Apply content types and required managed metadata columns.
5. Enable major versioning and content approval for recipe, policy, and training libraries.

### 3. Configure Search Schema and Optimization for Knowledge Ingestion

All SharePoint search settings are defined in `templates/sharepoint-search-config.yaml`. Apply each section in the order below.

#### 3a. Managed Property Mapping

1. In SharePoint admin center, go to **Search** > **Manage Search Schema**.
2. For each managed property defined in `sharepoint-search-config.yaml` under `managedProperties`, locate or create the property and set the following flags:

   | Property | Searchable | Queryable | Retrievable | Refinable | Sortable |
   |---|---|---|---|---|---|
   | DrinkCategory | Yes | Yes | Yes | Yes | No |
   | PolicyType | Yes | Yes | Yes | Yes | No |
   | StoreRegion | Yes | Yes | Yes | Yes | No |
   | JobRole | Yes | Yes | Yes | Yes | No |
   | ApprovalStatus | No | Yes | Yes | No | No |
   | LastApprovedDate | No | Yes | Yes | No | Yes |
   | ContentOwner | No | Yes | Yes | No | No |
   | SeasonalFlag | No | Yes | Yes | No | No |

3. Map each managed property to its crawled property (`ows_<ColumnName>`) as listed in the config file.
4. Save all changes.
5. Reindex all Virtual Coach libraries after any schema change.

#### 3b. Custom Search Result Sources

1. In SharePoint admin center, go to **Search** > **Manage Result Sources**.
2. Create one result source per entry in `sharepoint-search-config.yaml` under `resultSources`:
   - `VirtualCoach-Recipes` scoped to `RecipeLibraryUrl`.
   - `VirtualCoach-HrPolicy` scoped to `HrPolicyLibraryUrl`.
   - `VirtualCoach-Training` scoped to `TrainingLibraryUrl`.
   - `VirtualCoach-Operations` scoped to `OperationsLibraryUrl`.
   - `VirtualCoach-SeasonalMenu` scoped to `SeasonalMenuLibraryUrl`.
   - `VirtualCoach-AllLibraries` federated across the hub site for cross-library queries.
3. Set each query template to filter on `ApprovalStatus:Approved` to exclude draft and pending content.
4. Set the default sort to `LastApprovedDate` descending on each result source.

#### 3c. Search Schema Refiners

1. In SharePoint admin center, go to **Search** > **Manage Query Rules** or the refiners panel.
2. Confirm the following managed properties are marked as Refinable (already set in 3a):
   - `DrinkCategory`, `PolicyType`, `StoreRegion`, `JobRole`.
3. These refiners are used in the search verticals to narrow knowledge retrieval by topic domain.

#### 3d. Custom Search Verticals

1. In SharePoint admin center, go to **Search** > **Manage Search Verticals** (or via the Microsoft Search admin center for M365 Search).
2. Create one vertical per entry in `sharepoint-search-config.yaml` under `searchVerticals`:
   - **Recipes** - backed by `VirtualCoach-Recipes`, refiners: DrinkCategory, StoreRegion.
   - **Policies** - backed by `VirtualCoach-HrPolicy`, refiners: PolicyType, StoreRegion, JobRole.
   - **Training** - backed by `VirtualCoach-Training`, refiners: JobRole, StoreRegion.
   - **Operations** - backed by `VirtualCoach-Operations`, refiners: StoreRegion, JobRole.
   - **Seasonal Menu** - backed by `VirtualCoach-SeasonalMenu`, refiners: DrinkCategory, StoreRegion.
3. Configure the query template for each vertical as specified in the config file.

#### 3e. Relevance Ranking Tuning

1. In the search schema settings, enable the freshness boost on `LastApprovedDate`:
   - Boost factor: 1.4 for content approved within the last 90 days.
2. Enable the metadata completeness boost (factor 1.2) for records with all four required properties populated: DrinkCategory, PolicyType, StoreRegion, JobRole.
3. Add the three promoted results defined in `relevanceRanking.promoted_results` for espresso station, cold brew station, and opening/closing checklists.

#### 3f. Continuous Crawl and Crawl Schedule

1. In SharePoint admin center, go to **Search** > **Manage Content Sources**.
2. For each of the five Virtual Coach libraries, enable **Continuous Crawl**:
   - Recipes, HR Policy, Training, Operations, Seasonal Menu.
3. Set the incremental crawl schedule to every 15 minutes as a fallback.
4. Set the full crawl schedule to weekly on Sunday at 02:00.
5. After any managed property mapping change, trigger a manual full crawl for all affected libraries.

### 4. Import the Copilot Studio Solution
1. Open **Solutions** and select **Import solution**.
2. Import `solution/solution-definition.yaml`.
3. Populate environment variables for all SharePoint URLs and list endpoints.
4. Confirm all agent components and flows import without errors.

### 5. Configure Knowledge Sources
1. Open the Virtual Coach agent.
2. Under **Knowledge**, confirm each source points to the correct SharePoint library URL.
3. Run initial sync.
4. Validate retrieval quality with recipe, policy, training, operations, and seasonal menu prompts.

### 6. Configure Power Automate Flows (SharePoint-Specific)
1. Bind SharePoint connections for all imported flows.
2. Validate flow triggers and actions:
   - SharePoint list create/update for shift handover records.
   - SharePoint list read for store lookup.
   - SharePoint file approval notifications for recipe/policy content updates.
3. Confirm least-privilege access for service accounts.

### 7. Configure Authentication and Channels
1. Set authentication to Entra ID in Copilot Studio.
2. Publish to Microsoft Teams for desk-based staff.
3. Publish to custom website/mobile web chat for floor baristas.
4. Validate role-trimmed responses based on SharePoint permissions.

## Power Automate Flow Reference

| Flow Name | Trigger | SharePoint Connector Usage |
|-----------|---------|----------------------------|
| SaveShiftHandoverToSharePoint | Copilot Studio topic action | Create item in `shift-handover-list` |
| QueryStoreDirectory | Copilot Studio topic action | Get items from `store-directory-list` |
| NotifyContentApprovalPending | SharePoint file created or modified | Post approval notification to Teams/Email when status is Pending |

## Post-Deployment Validation

- [ ] Recipes return current approved versions from `recipes-library`.
- [ ] HR and policy responses ground only in approved `hr-policy-library` content.
- [ ] Training and operations topics retrieve role-relevant pages and documents.
- [ ] Store lookup returns correct region, manager, and contact details from `store-directory-list`.
- [ ] Shift handover submissions create records in `shift-handover-list`.
- [ ] Menu update requests resolve from `seasonal-menu-library`.
- [ ] Teams and mobile web channels both return consistent grounded answers.
- [ ] All eight generative answer validation criteria (GA-001 through GA-008) in `templates/sharepoint-search-config.yaml` pass.
- [ ] Citation rate is at or above 90 percent across the full query test set.
- [ ] No unapproved draft content surfaces in any generative answer.
- [ ] All five custom result sources return results scoped to their target library.
- [ ] All five search verticals are accessible and return correct results.
- [ ] Continuous crawl is active on all five Virtual Coach libraries.
- [ ] Search query coverage tests in `queryTests` pass for all 25 trigger phrase cases.

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review unresolved queries and gaps | Weekly | Copilot Studio Admin |
| Validate metadata completeness in libraries | Weekly | SharePoint Content Owner |
| Review content approvals and stale drafts | Daily | Operations Governance Lead |
| Re-sync knowledge sources after major updates | As needed | Platform Admin |
| Audit list writeback success rates | Weekly | Power Platform Admin |

## Rollback Procedure

1. Unpublish the current agent version.
2. Restore the previous solution package from source control.
3. Re-import and republish.
4. Rebind SharePoint connections if required.
5. Notify regional operations and store managers.
