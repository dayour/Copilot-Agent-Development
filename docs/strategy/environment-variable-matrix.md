# Environment Variable Matrix

## Overview
This document provides the complete environment variable matrix for all Copilot Studio agents across all verticals (Coffee, Clothing, Insurance, Tech, Transportation). For each variable, it specifies the value or value pattern used in each environment tier (Dev, Test/UAT, Production) and documents the secret management approach.

## Secret Management Principles

- Secrets (API keys, client secrets, passwords) are **never** stored as plain-text values in solution files or in Power Platform environment variable plain-value fields.
- Each environment tier has a dedicated Azure Key Vault instance. Environment variables of type Secret reference the appropriate vault per tier.
- Key Vault naming convention: `kv-<org>-<vertical>-<stage>` (for example, `kv-contoso-coffee-prod`).
- Service principal access to Key Vault is granted per environment; the Dev service principal cannot read from the Test/UAT or Production vaults.
- API keys must be rotated on schedule (see the Rotation Schedule section). The Key Vault reference in the environment variable does not change on rotation -- only the secret value in Key Vault is updated.

## Variable Type Reference

| Type | Description | Example |
|------|-------------|---------|
| String | Plain-text non-sensitive value | API base URL, environment name |
| Secret | Sensitive value resolved from Azure Key Vault at runtime | API key, client secret, password |
| Boolean | True/false flag | Feature toggle, debug mode |
| Number | Numeric value | Timeout seconds, retry count |

## Cross-Vertical Variables (All Agents)

These variables apply to every agent in every vertical.

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| EnvironmentName | String | `dev` | `test` | `prod` | Used by topics for environment-specific logic |
| KeyVaultBaseUri | String | `https://kv-<org>-<vertical>-dev.vault.azure.net/` | `https://kv-<org>-<vertical>-test.vault.azure.net/` | `https://kv-<org>-<vertical>-prod.vault.azure.net/` | Replace `<org>` and `<vertical>` per deployment |
| TelemetryEnabled | Boolean | `true` | `true` | `true` | Controls whether conversation telemetry is sent to monitoring |
| FlowTimeoutSeconds | Number | `120` | `60` | `30` | Timeout for Power Automate flow calls; stricter in production |
| ContentSafetyEnabled | Boolean | `false` | `true` | `true` | Content safety filtering; disabled in Dev for speed, required in Test/UAT and Production |

## Coffee -- Virtual Coach

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| SharePointSiteUrl | String | `https://<tenant>.sharepoint.com/sites/coffee-dev` | `https://<tenant>.sharepoint.com/sites/coffee-test` | `https://<tenant>.sharepoint.com/sites/coffee` | Root site URL for knowledge grounding |
| SharePointHubSiteId | String | Dev hub site GUID | Test hub site GUID | Production hub site GUID | Used by flows to enumerate store and regional sites |
| ShiftHandoverListId | String | Dev list GUID | Test list GUID | Production list GUID | Dataverse or SharePoint list ID for shift handover records |
| StoreDirectoryListId | String | Dev list GUID | Test list GUID | Production list GUID | List ID for store directory lookups |
| EscalationEmailAddress | String | `dev-escalation@<org>.com` | `test-escalation@<org>.com` | `coffee-ops@<org>.com` | Recipient for escalated conversations |

## Clothing -- Power Analysis

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| DataverseSalesTableName | String | `cr_salestransactions_dev` | `cr_salestransactions_test` | `cr_salestransactions` | Dataverse table name for sales data |
| DataverseInventoryTableName | String | `cr_inventorysnapshots_dev` | `cr_inventorysnapshots_test` | `cr_inventorysnapshots` | Dataverse table name for inventory snapshots |
| PowerBIWorkspaceId | String | Dev workspace GUID | Test workspace GUID | Production workspace GUID | Power BI workspace containing the analysis dataset |
| PowerBIDatasetId | String | Dev dataset GUID | Test dataset GUID | Production dataset GUID | Dataset ID for DAX query API calls |
| AIBuilderForecastModelId | String | Experimental model ID | Approved test model ID | Approved production model ID | Version-pinned in Production; automatic updates disabled |
| MaxQueryWindowDays | Number | `365` | `365` | `730` | Maximum historical window for analytical queries |

## Insurance -- Claims Assistant

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| ClaimsCoreApiBaseUrl | String | `https://claims-api-dev.<org>.com/api/v1` | `https://claims-api-test.<org>.com/api/v1` | `https://claims-api.<org>.com/api/v1` | Base URL for the claims core REST API |
| ClaimsCoreApiKey | Secret | Key Vault ref: `kv-<org>-insurance-dev` / `claims-api-key` | Key Vault ref: `kv-<org>-insurance-test` / `claims-api-key` | Key Vault ref: `kv-<org>-insurance-prod` / `claims-api-key` | API key for claims core; rotated every 90 days |
| FraudScoringThresholdHigh | Number | `0.80` | `0.80` | `0.80` | Score above this threshold routes claim to SIU |
| FraudScoringThresholdMedium | Number | `0.50` | `0.50` | `0.50` | Score above this threshold flags claim for adjuster review |
| StateRulesServiceUrl | String | `https://state-rules-dev.<org>.com/api/v1` | `https://state-rules-test.<org>.com/api/v1` | `https://state-rules.<org>.com/api/v1` | Regulatory rules lookup service endpoint |
| ComplianceEventLogTableName | String | `cr_complianceevents_dev` | `cr_complianceevents_test` | `cr_complianceevents` | Dataverse table for compliance audit events |
| AzureADB2CTenantName | String | `<org>-insurance-dev.b2clogin.com` | `<org>-insurance-test.b2clogin.com` | `<org>-insurance.b2clogin.com` | B2C tenant for external claimant authentication |
| AzureADB2CClientId | String | Dev app registration client ID | Test app registration client ID | Production app registration client ID | B2C application client ID |
| AzureADB2CClientSecret | Secret | Key Vault ref: `kv-<org>-insurance-dev` / `b2c-client-secret` | Key Vault ref: `kv-<org>-insurance-test` / `b2c-client-secret` | Key Vault ref: `kv-<org>-insurance-prod` / `b2c-client-secret` | B2C client secret; rotated every 180 days |
| TranscriptRetentionDays | Number | `30` | `30` | `2557` | Regulatory requirement: 7 years (7 x 365.25 rounded up = 2557 days) in Production |

## Tech -- Seller Prospect

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| SalesforceInstanceUrl | String | `https://<org>--dev.sandbox.my.salesforce.com` | `https://<org>--test.sandbox.my.salesforce.com` | `https://<org>.my.salesforce.com` | Salesforce org URL; sandbox in Dev and Test/UAT |
| SalesforceClientId | String | Dev connected app client ID | Test connected app client ID | Production connected app client ID | OAuth connected app per environment |
| SalesforceClientSecret | Secret | Key Vault ref: `kv-<org>-tech-dev` / `sf-client-secret` | Key Vault ref: `kv-<org>-tech-test` / `sf-client-secret` | Key Vault ref: `kv-<org>-tech-prod` / `sf-client-secret` | Rotated every 90 days |
| LeadQualificationPassScore | Number | `3` | `3` | `3` | BANT score (0-4) at or above which a lead is considered qualified |
| PublicKnowledgeBaseUrl | String | `https://kb-dev.<org>.com` | `https://kb-test.<org>.com` | `https://kb.<org>.com` | External knowledge base URL for prospect-facing topics |
| AzureADB2CTenantName | String | `<org>-tech-dev.b2clogin.com` | `<org>-tech-test.b2clogin.com` | `<org>-tech.b2clogin.com` | B2C tenant for external prospect web chat authentication |

## Tech -- IT Help Desk

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| ITSMBaseUrl | String | `https://dev-itsm.<org>.com/api/v1` | `https://test-itsm.<org>.com/api/v1` | `https://itsm.<org>.com/api/v1` | ServiceNow or Jira service management API base URL |
| ITSMApiKey | Secret | Key Vault ref: `kv-<org>-tech-dev` / `itsm-api-key` | Key Vault ref: `kv-<org>-tech-test` / `itsm-api-key` | Key Vault ref: `kv-<org>-tech-prod` / `itsm-api-key` | Rotated every 90 days |
| KnowledgeBaseId | String | Dev KB ID | Test KB ID | Production KB ID | ITSM knowledge base identifier for article search |
| TicketPriorityDefault | String | `medium` | `medium` | `medium` | Default ticket priority when not inferred from conversation |
| EscalationQueueName | String | `dev-it-escalation` | `test-it-escalation` | `it-escalation` | Name of the ITSM queue for escalated tickets |

## Transportation -- Fuel Tracking

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| FuelCardApiBaseUrl | String | `https://fuelcard-api-dev.<org>.com/api/v1` | `https://fuelcard-api-test.<org>.com/api/v1` | `https://fuelcard-api.<org>.com/api/v1` | Fuel card transaction API endpoint |
| FuelCardApiKey | Secret | Key Vault ref: `kv-<org>-transport-dev` / `fuelcard-api-key` | Key Vault ref: `kv-<org>-transport-test` / `fuelcard-api-key` | Key Vault ref: `kv-<org>-transport-prod` / `fuelcard-api-key` | Rotated every 90 days |
| TelematicsApiBaseUrl | String | `https://telematics-dev.<org>.com/api/v1` | `https://telematics-test.<org>.com/api/v1` | `https://telematics.<org>.com/api/v1` | Telematics data API endpoint |
| TelematicsApiKey | Secret | Key Vault ref: `kv-<org>-transport-dev` / `telematics-api-key` | Key Vault ref: `kv-<org>-transport-test` / `telematics-api-key` | Key Vault ref: `kv-<org>-transport-prod` / `telematics-api-key` | Rotated every 90 days |
| FuelPriceApiBaseUrl | String | `https://fuelprice-api-dev.<org>.com/api/v1` | `https://fuelprice-api-test.<org>.com/api/v1` | `https://fuelprice-api.<org>.com/api/v1` | Market fuel price API endpoint |
| AnomalyVolumeThresholdLitres | Number | `200` | `200` | `200` | Transaction volume above this triggers anomaly rule evaluation |
| AnomalyFrequencyWindowMinutes | Number | `60` | `60` | `60` | Time window for frequency-based anomaly detection |
| FleetManagerTeamsChannelId | String | Dev Teams channel ID | Test Teams channel ID | Production Teams channel ID | Teams channel for anomaly alert notifications |
| TransactionIngestionScheduleCron | String | `0 * * * *` | `0 * * * *` | `0 * * * *` | Cron expression for hourly ingestion flow |

## Transportation -- Fleet Coordinator

| Variable Name | Type | Dev Value | Test/UAT Value | Production Value | Notes |
|---------------|------|-----------|----------------|-----------------|-------|
| FleetSystemApiBaseUrl | String | `https://fleet-api-dev.<org>.com/api/v1` | `https://fleet-api-test.<org>.com/api/v1` | `https://fleet-api.<org>.com/api/v1` | Fleet management system API endpoint |
| FleetSystemApiKey | Secret | Key Vault ref: `kv-<org>-transport-dev` / `fleet-api-key` | Key Vault ref: `kv-<org>-transport-test` / `fleet-api-key` | Key Vault ref: `kv-<org>-transport-prod` / `fleet-api-key` | Rotated every 90 days |
| DispatchNotificationEmail | String | `dev-dispatch@<org>.com` | `test-dispatch@<org>.com` | `dispatch@<org>.com` | Email address for dispatch coordination notifications |
| RouteOptimiserApiBaseUrl | String | `https://route-api-dev.<org>.com/api/v1` | `https://route-api-test.<org>.com/api/v1` | `https://route-api.<org>.com/api/v1` | Route optimiser service endpoint |

## Secret Rotation Schedule

| Secret Category | Rotation Frequency | Responsible Role |
|-----------------|-------------------|-----------------|
| API keys (external providers) | Every 90 days | IT Admin |
| OAuth client secrets (Salesforce, B2C, ITSM) | Every 180 days | IT Admin |
| Service account passwords | Every 90 days | IT Admin |
| Azure Key Vault access policies | Reviewed quarterly | Security Reviewer |

Rotation is performed directly in Azure Key Vault. Because environment variables reference the Key Vault secret by name (not by version), agents automatically use the new secret value on the next call without requiring a solution re-import or republish.

## Populating Variables During Deployment

When importing a managed solution into a new environment, Power Platform prompts for environment variable values during import. Follow these steps.

1. Before import, retrieve the appropriate values from the environment's Azure Key Vault and configuration register.
2. During `pac solution import`, supply variable values via the `--solutionComponentParameters` flag or the interactive import UI in Power Platform Admin Center.
3. After import, verify each variable in the solution's environment variables panel shows the correct value (or Key Vault reference) for the target environment.
4. For variables of type Secret, confirm the Key Vault reference resolves successfully by triggering a test flow that reads the secret.

## Related Documents
- `docs/strategy/environment-topology.md` -- environment tiers, naming, and access.
- `docs/strategy/promotion-pipeline.md` -- promotion process and solution import steps.
- `docs/strategy/dlp-policy-templates.md` -- connector policies per environment.
- `docs/admin-governance.md` -- security hardening checklist and Key Vault integration.
