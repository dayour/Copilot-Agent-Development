# Runbook — Fleet Coordinator (Transportation)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the Fleet Coordinator agent for the Transportation vertical.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Automate | For fleet management system integration |
| Azure AD | For authentication and driver/manager identity |
| Dataverse environment | To store incident reports and scheduling logs |
| Fleet Management API | REST endpoint for vehicle and schedule data |

---

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Confirm the environment region matches your operational and data residency requirements.

### 2. Import the Solution
1. Go to **Solutions** → **Import solution**.
2. Upload `solution/solution-definition.yaml`.
3. Map environment variables:
   - `FleetManagementApiUrl` — REST endpoint of your fleet management system
   - `FleetManagementApiKey` — API key or OAuth2 client credentials
   - `MappingApiKey` — API key for routing/mapping provider
   - `MaintenanceTeamEmail` — email address for maintenance alerts
4. Complete the import and verify all components show **Healthy**.

### 3. Configure Knowledge Sources
1. Open the imported agent in Copilot Studio.
2. Navigate to **Knowledge** → **Add knowledge source**.
3. Add the SharePoint library containing compliance documents, vehicle manuals, and safety procedures.
4. Run a manual sync and confirm compliance Q&A topics are populated.

### 4. Configure Power Automate Flows
1. Open the **Get Vehicle Availability** flow — update the HTTP action with `FleetManagementApiUrl` and authentication details. Test with a sample vehicle ID.
2. Open the **Log Maintenance Alert** flow — update the email action with `MaintenanceTeamEmail`. Test end-to-end.
3. Open the **Create Incident Report** flow — confirm it saves to the Dataverse **IncidentReports** table and sends notification.

### 5. Configure Authentication
1. In **Settings** → **Security** → **Authentication**, select **Authenticate with Microsoft**.
2. Restrict access to your Azure AD tenant (drivers and managers only).

### 6. Publish to Microsoft Teams
1. Navigate to **Channels** → **Microsoft Teams**.
2. Click **Turn on Teams**.
3. For mobile field workers, also enable the **Mobile app** channel via Power Apps.
4. Test by messaging the agent and requesting vehicle availability.

---

## Post-Deployment Validation

- [ ] Vehicle scheduling topic returns correct availability from the fleet management system
- [ ] Maintenance alert topic logs an alert and sends notification to the maintenance team
- [ ] Compliance check topic returns correct MOT/inspection due dates
- [ ] Incident reporting topic collects all required fields and creates a Dataverse record
- [ ] Route guidance topic returns a valid route from the mapping API
- [ ] Authentication restricts access to registered drivers and fleet managers

---

## Monitoring & Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review incident report completeness | Weekly | Fleet Manager |
| Update compliance documents | On regulation change | Compliance Officer |
| API connectivity health check | Daily (automated) | IT Admin |
| Review unrecognised inputs | Bi-weekly | Copilot Studio Admin |
| Licence & usage review | Quarterly | IT Admin |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| Agent not responding | IT Admin | Microsoft Support |
| Fleet API integration failure | IT Admin | Fleet System Vendor |
| Compliance information error | Compliance Officer | Legal Team |
| Incident data loss | IT Admin | Data Protection Officer |

---

## Rollback Procedure

1. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
2. Restore the previous solution version from source control.
3. Re-import and re-publish the previous version.
4. Notify fleet managers and drivers of the temporary reversion.
