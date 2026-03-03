# Route Optimization Scheduler

## Overview

**Agent Name:** Route Optimization Scheduler
**Vertical:** Transportation
**Primary Users:** Dispatchers, route planners, operations managers
**Target Channels:** Microsoft Teams, web dashboard

Route Optimization Scheduler is a Copilot Studio agent that automates multi-stop route optimization, delivery scheduling, and constraint-based planning (time windows, vehicle capacity, driver hours) for enterprise fleet operations. It delivers real-time re-routing and ETA prediction, enforces Hours of Service (HOS) constraints, respects driver certifications, and proactively re-routes when traffic delays exceed configured thresholds.

## Business Goals

- Reduce total route distance and delivery time through optimized stop sequencing
- Improve on-time delivery rates with real-time ETA calculation and proactive delay alerts
- Ensure regulatory compliance by enforcing HOS limits before route assignment
- Improve fleet safety and legal compliance by matching route requirements to driver certifications (e.g., hazmat)

## Core Topics

- **Optimize Route**: Multi-stop route sequencing that respects time windows and minimizes total travel time
- **Schedule Deliveries**: Assigns delivery orders to routes and driver schedules with time window and capacity constraints
- **Check Constraints**: Validates route feasibility against vehicle capacity, driver hours, and time window constraints
- **Re-Route**: Proactive notification and alternate routing when a traffic delay exceeds the configured threshold
- **ETA Update**: Real-time arrival estimate updates for in-progress routes using current vehicle position and live traffic data
- **Driver Assignment**: Matches drivers to routes based on availability, proximity, and required certifications
- **Route History**: Retrieves historical route records including on-time performance and constraint violations

## Folder Structure

```text
transportation/
  agents/
    route-optimizer/
      README.md
      runbook.md
      templates/
        agent-template.yaml
      solution/
        solution-definition.yaml
```

## Solution Components

- Copilot Studio agent definition and topic scaffold
- Dataverse schema for routes, stops, driver assignments, and HOS records
- Power Automate flow contracts for optimization, ETA, re-routing, and driver matching
- Environment variable model for mapping API, traffic API, HOS threshold, and re-routing delay threshold
