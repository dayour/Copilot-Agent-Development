# Transportation

Showcase library of Copilot Studio agents for the Transportation vertical. Each agent includes a runbook, conversation template, and solution definition file ready to import into your Power Platform environment.

## Agents

| Agent | Description |
|-------|-------------|
| [Fleet Coordinator](./agents/fleet-coordinator/) | Assists fleet managers and drivers with scheduling, maintenance alerts, compliance checks, incident reporting, and route guidance |
| [Fuel Tracking](./agents/fuel-tracking/) | Provides fuel spend analytics, anomaly detection, fuel card management, and route-aware fuel price recommendations |
| [Route Optimization Scheduler](./agents/route-optimizer/) | Automates multi-stop route planning, real-time ETA tracking, HOS compliance checks, and certification-aware driver assignment |

## Cross-Agent Integration

All three agents share a common Dataverse foundation and integrate through Power Automate flows to deliver unified fleet intelligence:

| Integration | Agents Involved | Description |
|-------------|-----------------|-------------|
| Fuel-Route Correlation | Fuel Tracking + Route Optimizer | Route Optimizer calls Fuel Tracking to retrieve tank level and fuel prices, then inserts cost-effective fuel stops into the optimized route when tank level is below 25% |
| Maintenance-Route Awareness | Fleet Coordinator + Route Optimizer | Fleet Coordinator maintenance alerts update VehicleMaster; Route Optimizer checks maintenance status before every driver assignment and blocks vehicles on critical hold |
| Unified Fleet Dashboard | All three agents | A single "Give me a fleet overview" trigger returns an adaptive card spanning vehicle health, fuel spend, and route performance from all three agents |
| Cross-Agent Escalation | Fleet Coordinator + Route Optimizer + Fuel Tracking | Breakdown incidents reported to Fleet Coordinator automatically trigger Route Optimizer re-routing of affected deliveries and a Fuel Tracking fuel card suspension check, with manual override for the dispatcher |

See [Cross-Agent Validation](./agents/cross-agent-validation.md) for integration test cases covering all four integration points.

## Shared Components

The [shared](./agents/shared/) solution defines Dataverse tables used across all three agent solutions:

| Table | Description |
|-------|-------------|
| VehicleMaster | Canonical vehicle registry: type, fuel type, tank capacity, maintenance status |
| DriverMaster | Canonical driver registry: certifications, HOS status, assigned vehicle, fuel card |

Deploy the shared solution before importing any of the three agent solutions. See [shared/README.md](./agents/shared/README.md) for deployment order and solution layering details.

## Folder Structure

```
transportation/
└── agents/
    ├── cross-agent-validation.md
    ├── shared/
    │   ├── README.md
    │   └── solution/
    │       └── solution-definition.yaml
    ├── fleet-coordinator/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── fuel-tracking/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    └── route-optimizer/
        ├── README.md
        ├── runbook.md
        ├── templates/
        │   └── agent-template.yaml
        └── solution/
            └── solution-definition.yaml
```
