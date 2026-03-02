# Cross-Agent Validation — Transportation

## Overview

This document defines the integration validation test cases that must pass before releasing the three Transportation agents — **Fleet Coordinator**, **Fuel Tracking**, and **Route Optimization Scheduler** — together in a production environment.

Cross-agent validation confirms that data shared between agents is consistent, that actions taken in one agent correctly influence the behavior of the others, and that a unified fleet operations experience is delivered to fleet managers.

## Agents Under Test

| Agent | Primary Function |
|-------|-----------------|
| [Fleet Coordinator](./fleet-coordinator/) | Vehicle scheduling, maintenance alerts, compliance checks, incident reporting |
| [Fuel Tracking](./fuel-tracking/) | Fuel spend analytics, anomaly detection, fuel card management |
| [Route Optimization Scheduler](./route-optimizer/) | Multi-stop route planning, real-time ETA, HOS compliance, driver assignment |

## Cross-Agent Test Cases

| # | Test Case | Agents Involved | Expected Result |
|---|-----------|-----------------|-----------------|
| 1 | Fleet Coordinator maintenance alert excludes vehicle from Route Optimizer | Fleet Coordinator → Route Optimizer | Vehicle with a critical maintenance flag raised in Fleet Coordinator is not included in Route Optimizer driver assignment or stop sequencing |
| 2 | Fuel-route correlation recommends fuel stops on optimized route | Fuel Tracking → Route Optimizer | When tank level is low and cheaper fuel options exist along the active route, Route Optimizer includes recommended fuel stops sourced from Fuel Tracking's Fuel Price Finder |
| 3 | Unified dashboard returns data from all three agents | Fleet Coordinator + Fuel Tracking + Route Optimizer | A single adaptive card surface shows Fleet Coordinator vehicle health status, Fuel Tracking weekly spend and anomaly count, and Route Optimizer on-time delivery rate |

## Test Case Details

### Test 1 — Maintenance Flag Excludes Vehicle from Route Optimizer

**Preconditions:**
- Vehicle `V-1001` is registered in the fleet.
- A critical maintenance alert is raised for `V-1001` via the Fleet Coordinator Maintenance Alert topic.
- The alert severity is set to **High — take vehicle off road**.

**Steps:**
1. In Fleet Coordinator, submit a high-severity maintenance alert for `V-1001`.
2. Confirm the alert is logged in Dataverse `IncidentReports` (or `MaintenanceAlerts`) with critical flag.
3. Open Route Optimization Scheduler and attempt to assign vehicle `V-1001` to a new route.
4. Verify that the optimization or assignment flow queries Fleet Coordinator's maintenance status before proceeding.

**Expected Result:**
- Vehicle `V-1001` is excluded from the optimized route candidate list.
- The agent returns a message indicating the vehicle is unavailable due to a maintenance hold.
- No `DriverAssignment` record is created for `V-1001`.

**Pass Criteria:**
- [ ] Maintenance flag data is read from Fleet Coordinator's Dataverse table during Route Optimizer's assignment flow.
- [ ] Route Optimizer does not assign or include `V-1001` in any active route.
- [ ] Dispatcher receives a clear explanation citing the maintenance hold.

---

### Test 2 — Fuel-Route Correlation Recommends Fuel Stops

**Preconditions:**
- An active route `R-2001` has 6 stops along interstate corridor I-40 (Nashville to Memphis).
- Vehicle `T-305` assigned to `R-2001` has a current tank level below 25% as reported by telematics.
- Fuel Tracking's Fuel Price Finder has identified two stations along I-40 with prices at least 10% below the fleet's average price-per-gallon.

**Steps:**
1. In Route Optimization Scheduler, request route optimization for `R-2001`.
2. Confirm the optimization flow calls Fuel Tracking's `GetFuelPrices` tool (or equivalent) with the route corridor.
3. Verify that the optimized stop list includes the recommended fuel stops inserted at logically appropriate positions.

**Expected Result:**
- The optimized route includes at least one fuel stop recommended by the Fuel Tracking agent.
- The fuel stop is positioned so it does not violate existing time windows for delivery stops.
- The adaptive card response shows the recommended fuel station name, price per gallon, and route deviation (if any).

**Pass Criteria:**
- [ ] Route Optimizer's optimization flow integrates with Fuel Tracking's price recommendation data.
- [ ] Fuel stop insertion does not cause time window violations for any existing delivery stop.
- [ ] Agent response displays fuel stop details alongside route summary.

---

### Test 3 — Unified Dashboard Returns Data from All Three Agents

**Preconditions:**
- Fleet Coordinator has active vehicle health data (at least one vehicle with pending maintenance).
- Fuel Tracking has weekly spend data and at least one open anomaly.
- Route Optimization Scheduler has at least one completed route for the current week with on-time status.

**Steps:**
1. Trigger the unified dashboard topic (e.g., "Show fleet dashboard" or "Fleet operations summary").
2. Confirm the flow queries all three agents' data sources in parallel.
3. Verify the adaptive card response renders data from all three agents.

**Expected Result:**
- A single adaptive card displays:
  - **Fleet Coordinator**: total active vehicles, vehicles with maintenance alerts, next compliance due date.
  - **Fuel Tracking**: weekly fuel spend, budget variance, open anomaly count.
  - **Route Optimization Scheduler**: routes completed this week, on-time delivery rate, active re-routing alerts.

**Pass Criteria:**
- [ ] All three data sections are present in the adaptive card response.
- [ ] Data values match independent spot-checks against each agent individually.
- [ ] Dashboard loads within an acceptable response time (< 5 seconds under normal load).
- [ ] Fleet manager receives actionable summary without needing to query each agent separately.

## Validation Process

1. Deploy all three agents to the shared test environment.
2. Load test data into all required Dataverse tables (`IncidentReports`, `FuelTransactions`, `Routes`, `RouteStops`, `DriverAssignments`, `HosRecords`).
3. Execute each cross-agent test case in order and record pass/fail with screenshots.
4. Document any deviations with the actual vs expected result and a screenshot.
5. Re-test any failed cases after fixes are applied.
6. Obtain sign-off from the fleet operations stakeholder before promoting to production.

## Sign-off Checklist

- [ ] Test 1 (Maintenance flag exclusion) passed and screenshot captured
- [ ] Test 2 (Fuel-route correlation) passed and screenshot captured
- [ ] Test 3 (Unified dashboard) passed and screenshot captured
- [ ] Deviations documented and resolved
- [ ] Fleet operations stakeholder sign-off obtained
