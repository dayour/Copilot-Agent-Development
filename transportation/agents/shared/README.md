# Transportation Shared Dataverse Solution

## Overview

**Solution Name:** TransportationSharedDataverse
**Deploy Order:** 1 (must be deployed before any of the three agent solutions)

This solution defines the shared Dataverse tables used by all three Transportation agents:

- Fleet Coordinator
- Fuel Tracking
- Route Optimization Scheduler

Deploying shared tables as a separate base solution prevents schema conflicts when multiple agent solutions are imported into the same Power Platform environment and enables solution layering.

## Shared Tables

| Table | Purpose |
|-------|---------|
| VehicleMaster | Canonical vehicle registry including type, fuel type, tank capacity, and maintenance status |
| DriverMaster | Canonical driver registry including certifications, HOS status, assigned vehicle, and fuel card |

## Lookup Relationships

The shared tables are referenced by the agent-specific tables listed below. Each relationship is a many-to-one lookup from the agent table to the shared master record.

| Agent Solution | Agent Table | Lookup Column | Shared Table |
|---|---|---|---|
| Fuel Tracking | FuelTransactions | vehicle_id | VehicleMaster |
| Fuel Tracking | VehicleFuelProfiles | vehicle_id | VehicleMaster |
| Fuel Tracking | FuelCards | vehicle_id | VehicleMaster |
| Fuel Tracking | FuelCards | driver_id | DriverMaster |
| Route Optimizer | Routes | vehicle_id | VehicleMaster |
| Route Optimizer | Routes | driver_id | DriverMaster |
| Route Optimizer | DriverAssignments | driver_id | DriverMaster |
| Route Optimizer | HosRecords | driver_id | DriverMaster |

## Solution Layering

```
Layer 1 (deploy first):  TransportationSharedDataverse
Layer 2 (deploy after):  TransportationFleetCoordinator
                         FuelTrackingSolution
                         RouteOptimizationSchedulerSolution
```

Each agent solution declares `TransportationSharedDataverse` as a dependency. Power Platform enforces the layer order at import time.

## Folder Structure

```text
transportation/
  agents/
    shared/
      README.md
      solution/
        solution-definition.yaml
```

## Deployment

1. Open the target Power Platform environment.
2. Import `solution/solution-definition.yaml` for `TransportationSharedDataverse`.
3. Verify that `VehicleMaster` and `DriverMaster` tables are present and healthy.
4. Proceed to import the three agent solutions in any order.
