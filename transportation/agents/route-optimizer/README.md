# Route Optimization Scheduler

## Overview

**Agent Name:** Route Optimization Scheduler
**Vertical:** Transportation
**Primary Users:** Fleet managers, dispatchers, drivers
**Target Channels:** Microsoft Teams, mobile web chat

Route Optimization Scheduler is a Copilot Studio agent that automates multi-stop route planning, real-time ETA tracking, and driver assignment for enterprise fleet operations. It enforces Hours of Service (HOS) constraints, respects driver certifications, and proactively re-routes when traffic delays exceed configured thresholds.

## Business Goals

- Reduce total route distance and delivery time through optimized stop sequencing
- Improve on-time delivery rates with real-time ETA calculation and proactive delay alerts
- Ensure regulatory compliance by enforcing HOS limits before route assignment
- Improve fleet safety and legal compliance by matching route requirements to driver certifications (e.g., hazmat)

## Core Topics

- **Route Optimization**: Multi-stop route sequencing that respects time windows and minimizes travel time
- **Order-Based Delivery Optimization**: Fetches unscheduled orders for a driver from the order management system, applies vehicle and driver constraints, and presents an optimized route with adaptive card showing stop sequence, map link, and estimated schedule
- **What-If Route Analysis**: Re-optimizes a route with a proposed additional stop, shows impact on total time and per-stop ETAs, and lets the dispatcher accept or reject the change
- **Route Comparison**: Side-by-side comparison of two routes across total distance, total time, stop count, fuel cost estimate, and on-time delivery probability
- **ETA Calculation**: Real-time arrival estimates using current vehicle position and live traffic data
- **Re-routing Alert**: Proactive notification when a traffic delay exceeds the configured threshold
- **HOS Compliance Check**: Validates driver hours before assigning additional routes to prevent over-hours scheduling
- **Driver Assignment**: Matches drivers to routes based on availability, proximity, and required certifications

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
- Dataverse schema for routes, stops (with service time and priority), driver assignments, and HOS records
- Power Automate flow contracts for optimization, order fetching, what-if analysis, route comparison, ETA, re-routing, and driver matching
- Environment variable model for mapping API, traffic API, telematics API, HOS system, order management system, and operational thresholds
