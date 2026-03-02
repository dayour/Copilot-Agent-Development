# Route Optimization Scheduler

## Overview

**Agent Name:** Route Optimization Scheduler
**Vertical:** Transportation
**Primary Users:** Fleet managers, dispatchers, drivers
**Target Channels:** Microsoft Teams, mobile web chat

Route Optimization Scheduler is a Copilot Studio agent that automates multi-stop route planning, constraint-based schedule building, real-time ETA tracking, and driver assignment for enterprise fleet operations. It enforces Hours of Service (HOS) constraints, respects driver certifications and vehicle capacity limits, detects scheduling conflicts, and proactively re-routes when traffic delays exceed configured thresholds.

## Business Goals

- Reduce total route distance and delivery time through optimized stop sequencing
- Improve on-time delivery rates with real-time ETA calculation and proactive delay alerts
- Ensure regulatory compliance by enforcing DOT HOS limits before route assignment
- Improve fleet safety and legal compliance by matching route requirements to driver certifications (e.g., hazmat, liftgate, tanker endorsement)
- Prevent overloading by validating vehicle weight, volume, and pallet capacity against order requirements
- Surface scheduling conflicts proactively with actionable resolution suggestions

## Core Topics

- **Route Optimization**: Multi-stop route sequencing that respects time windows and minimizes travel time
- **ETA Calculation**: Real-time arrival estimates using current vehicle position and live traffic data
- **Re-routing Alert**: Proactive notification when a traffic delay exceeds the configured threshold
- **HOS Compliance Check**: Validates driver hours before assigning additional routes to prevent over-hours scheduling
- **Driver Assignment**: Matches drivers to routes based on availability, proximity, and required certifications; confirms assignment and updates DriverSchedules
- **Schedule Builder**: Builds a full delivery schedule for a target date by pulling pending orders, checking driver and vehicle availability against all constraints, and presenting a proposed schedule with conflict highlights
- **Conflict Detection**: Evaluates a proposed or existing schedule and returns a conflict report covering HOS violations, vehicle overloads, overlapping time windows, and missing certifications -- each with suggested resolutions
- **HOS Tracking**: Returns a driver's remaining drive time, on-duty time, and required rest periods; alerts when approaching daily or weekly DOT limits

## Constraint Engine

The constraint engine is backed by four Dataverse tables that define the rules applied during schedule building and conflict detection:

| Table | Purpose |
|---|---|
| DriverHoursOfService | DOT-regulated max drive time, on-duty limits, and required break intervals per driver |
| VehicleCapacity | Maximum weight, volume, and pallet positions per vehicle with current load state |
| DeliveryWindows | Customer-specific hard and soft time windows per stop with day-of-week applicability |
| SpecialRequirements | Route and stop requirements such as hazmat certification, liftgate, and temperature control |

Constraints are evaluated in the following order during schedule building:
1. Driver HOS availability (daily and weekly limits)
2. Vehicle capacity (weight, volume, pallet positions)
3. Delivery time windows (hard window violations block assignment; soft window violations apply a penalty score)
4. Special requirements (mandatory certifications and vehicle features must match)

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
- Dataverse schema for routes, stops, driver assignments, HOS records, and constraint engine tables
- Power Automate flow contracts for optimization, ETA, re-routing, schedule building, conflict detection, driver matching, and HOS tracking
- Environment variable model for mapping API, traffic API, HOS threshold, re-routing delay threshold, and order management system
