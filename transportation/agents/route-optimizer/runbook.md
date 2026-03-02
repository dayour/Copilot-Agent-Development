# Route Optimization Scheduler Deployment Runbook

## 1. Purpose

This runbook defines deployment, validation, monitoring, and rollback for the Route Optimization Scheduler Copilot Studio agent used by fleet managers, dispatchers, and drivers in the Transportation vertical.

## 2. Prerequisites

### Platform and Licensing

- Microsoft Copilot Studio license for makers and target users
- Power Automate Premium license (required for premium connectors and HTTP integrations)
- Dataverse environment with sufficient capacity
- Power Platform admin access for solution import and connection references

### External System Access

- Mapping and routing API access (e.g., Azure Maps, Google Maps Platform, or HERE)
  - Route optimization endpoint
  - Real-time traffic data endpoint
  - API key or OAuth credentials
- Telematics API access
  - Vehicle GPS position feed endpoint
  - API credentials
- Hours of Service (HOS) system access
  - Driver HOS records endpoint
  - API credentials

### Security and Operations

- Approved service account for connector authentication
- Alert destination mailbox or Teams channel for re-routing and delay notifications
- Change window approved by fleet operations and dispatch team

## 3. Solution Import

1. Open target Power Platform environment.
2. Import managed solution package for Route Optimization Scheduler.
3. Resolve all connection references during import.
4. Set environment variables.
5. Publish customizations.
6. Verify all cloud flows are turned on.

### Required Environment Variables

| Variable Name | Description | Example |
|---|---|---|
| OrderManagementApiUrl | Order management system REST base URL | `https://api.ordermgmt.contoso.com/v1` |
| OrderManagementApiKey | Order management API key or token reference | `kv://ordermgmt/api-key` |
| MappingApiUrl | Mapping and routing API base URL | `https://atlas.microsoft.com/route` |
| MappingApiKey | Mapping API key or token reference | `kv://mapping/api-key` |
| TrafficApiUrl | Real-time traffic data API base URL | `https://atlas.microsoft.com/traffic` |
| TrafficApiKey | Traffic API key or token reference | `kv://traffic/api-key` |
| TelematicsApiUrl | Telematics REST base URL | `https://api.telematicsvendor.com/v2` |
| TelematicsApiKey | Telematics API key or token reference | `kv://telematics/api-key` |
| HosApiUrl | HOS system REST base URL | `https://api.hossystem.com/v1` |
| HosApiKey | HOS system API key or token reference | `kv://hos/api-key` |
| RerouteDelayThresholdMinutes | Delay in minutes that triggers a re-routing alert | `30` |
| DispatchAlertEmail | Dispatch team distribution list for re-routing alerts | `fleet-dispatch@contoso.com` |

## 4. Dataverse Table Provisioning

Provision and validate the following tables before enabling production traffic:

**Core tables:**
- `Routes`
- `RouteStops`
- `DriverAssignments`
- `HosRecords`

**Constraint engine tables:**
- `DriverHoursOfService`
- `VehicleCapacity`
- `DeliveryWindows`
- `SpecialRequirements`

### Validation Steps

1. Confirm all tables are present in solution.
2. Confirm primary keys and required columns exist.
3. Validate data types for coordinates, timestamps, and duration fields.
4. Validate indexes for high-read queries (`route_id`, `driver_id`, `planned_departure`).
5. Seed test routes with multiple stops and confirm optimization flow executes correctly.
6. Seed `DriverHoursOfService` with at least two drivers -- one near the daily limit and one with ample hours remaining -- and confirm the Schedule Builder correctly excludes the near-limit driver from over-hours assignments.
7. Seed `VehicleCapacity` with at least two vehicles -- one at capacity and one with available space -- and confirm the Schedule Builder correctly excludes the at-capacity vehicle from overloaded assignments.
8. Seed `DeliveryWindows` with at least one hard window and one soft window and confirm the Conflict Detection flow returns the correct conflict type for each.
9. Seed `SpecialRequirements` with a hazmat requirement on a test route and confirm Driver Assignment blocks non-certified drivers.

## 5. Knowledge Source Configuration

Configure knowledge sources in Copilot Studio:

- Fleet dispatch standard operating procedures
- Driver Hours of Service regulations and policy (DOT 49 CFR Part 395)
- Hazardous materials (hazmat) transport compliance guidelines
- Route planning and load assignment policies
- Vehicle capacity and load limit standards
- Delivery window service level agreements per customer

Knowledge source recommendation:

- SharePoint document library for controlled policy content
- Refresh cadence: daily or on policy-change trigger

## 6. Authentication and Authorization

1. Configure Entra ID authentication for enterprise users.
2. Enable SSO where supported by channel (Teams first).
3. Map user role attributes (fleet manager, dispatcher, driver) to conversational branching.
4. Restrict driver assignment and route modification actions to authorized roles (fleet manager, dispatcher).
5. Enable audit logging for route assignments and HOS override requests.

## 7. Channel Deployment

### Teams

1. Enable Teams channel in Copilot Studio.
2. Validate sign-in experience and user context.
3. Validate response formatting for desktop and mobile Teams clients.
4. Publish Teams app to pilot group (dispatch team), then broad rollout.

### Mobile Web Chat

1. Enable web channel and generate embed configuration.
2. Apply branding and security headers.
3. Validate authentication redirect handling on mobile browsers (drivers in cabs).
4. Validate latency under expected concurrency.

## 8. Validation Checklist

### Functional Tests

- [ ] Multi-stop optimization returns valid sequence — all stops visited, time windows respected, sequence is optimized
- [ ] Real-time ETA calculation matches expected arrival — ETA within acceptable tolerance based on current position and traffic
- [ ] Re-routing triggers on traffic delay — proactive notification sent when delay exceeds threshold (e.g., 30 min)
- [ ] Constraint engine prevents over-hours scheduling — driver exceeding HOS limits is not assigned additional routes
- [ ] Driver assignment respects certifications — hazmat route only assignable to hazmat-certified drivers
- [ ] Schedule Builder pulls pending orders and returns a conflict-free proposed schedule when no constraints are violated
- [ ] Schedule Builder flags unscheduled orders when no eligible driver or vehicle is available
- [ ] Conflict Detection returns a HOS conflict when a driver's assigned hours exceed the daily DOT limit
- [ ] Conflict Detection returns a capacity conflict when total order weight exceeds vehicle maximum payload
- [ ] Conflict Detection returns a time window conflict when a stop arrival falls outside the customer delivery window
- [ ] Conflict Detection returns a certification conflict when a driver without hazmat certification is assigned to a hazmat route
- [ ] Conflict Detection provides at least one resolution suggestion per conflict
- [ ] HOS Tracking returns correct remaining drive time, on-duty time, and next break requirement for a specified driver
- [ ] HOS Tracking triggers an approaching-limit alert when remaining daily drive time is below 2 hours

### Integration Tests

- [ ] Optimization flow queries mapping API and returns a valid sequenced stop list
- [ ] ETA calculation flow reads vehicle GPS position from telematics API and applies live traffic data
- [ ] Re-routing alert flow fires within configured threshold and posts to dispatch channel
- [ ] HOS compliance check flow reads from HOS system and blocks assignment when limit is reached
- [ ] Driver assignment flow filters certification attribute and excludes non-certified drivers from hazmat routes
- [ ] Schedule Builder flow calls order management API for pending orders and applies all constraint engine tables
- [ ] Conflict Detection flow reads DriverHoursOfService, VehicleCapacity, DeliveryWindows, and SpecialRequirements tables and returns typed conflict records
- [ ] HOS Tracking flow reads HOS API and telematics duty-status endpoint and upserts the DriverHoursOfService table

## 9. Monitoring Cadence

### Daily

- Route optimization flow health (run success rate, API failures, latency)
- Re-routing alert volume and threshold trigger frequency
- HOS constraint violations flagged
- Schedule Builder conflict count per day (target: zero unresolved conflicts before dispatch)
- Conflict Detection flow run success rate

### Weekly

- On-time delivery rate vs pre-agent baseline
- Driver assignment efficiency (unassigned routes, reassignments)
- Re-routing accuracy review (were re-routed ETAs better than original?)
- HOS Tracking alert frequency per driver (identify drivers consistently approaching limits)
- VehicleCapacity utilization report (average load factor across fleet)

### Monthly

- Threshold tuning review (re-route delay threshold, HOS margin settings)
- Connector and API quota and performance review
- Policy documentation freshness review
- Constraint engine table data quality audit (stale DeliveryWindows, outdated SpecialRequirements)

## 10. Escalation Matrix

| Severity | Trigger | Owner | SLA |
|---|---|---|---|
| Sev 1 | Optimization or ETA flow outage, dispatch cannot assign routes | Platform Ops + Integration Team | 1 hour |
| Sev 2 | Re-routing alerts not firing, HOS check degraded | Data/Integration + Fleet Ops | 4 hours |
| Sev 3 | Single topic degradation or channel issue | Product Owner + Support | 1 business day |

Notification path:

1. Automated alert to `DispatchAlertEmail`
2. Incident channel post with impact summary
3. On-call engineer assignment and triage

## 11. Rollback Procedure

1. Disable Teams and web publication for Route Optimization Scheduler agent.
2. Turn off high-risk flows (driver assignment, HOS check) if behavior is unsafe.
3. Revert to last known good managed solution version.
4. Restore previous environment variable values.
5. Re-run smoke tests for optimization, ETA, and HOS compliance scenarios.
6. Communicate rollback completion and residual risk to stakeholders.

## 12. Post-Deployment Operational Notes

- Review re-route delay threshold quarterly with dispatch team.
- Use staged rollout when adding new certification types to the driver assignment constraint engine.
- Keep HOS limit logic current with applicable regulatory updates.
- Keep fleet operations and dispatch teams in weekly review loop for threshold tuning.
