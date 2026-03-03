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
- **ETA Calculation**: Real-time arrival estimates using current vehicle position and live traffic data
- **ETA Update**: Delivery-order-based ETA lookup with confidence level and change delta adaptive card
- **Re-routing Alert**: Proactive notification when a traffic delay exceeds the configured threshold, with impact assessment showing time saved, additional distance, and affected deliveries
- **HOS Compliance Check**: Validates driver hours before assigning additional routes to prevent over-hours scheduling
- **Driver Assignment**: Matches drivers to routes based on availability, proximity, and required certifications
- **Delay Reason Logging**: Captures delay reasons (traffic, breakdown, weather, customer not available) to the RouteDelays table for operational reporting
- **ETA Accuracy Report**: Historical accuracy metrics comparing predicted versus actual arrival times, broken down by driver, route type, and time of day

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
- Dataverse schema for routes, stops, driver assignments, HOS records, delay reasons, and ETA accuracy tracking
- Power Automate flow contracts for optimization, ETA, re-routing, customer notification, delay logging, accuracy tracking, and driver matching
- Environment variable model for mapping API, traffic API, telematics API, HOS threshold, re-routing delay threshold, customer notification settings, and ETA change threshold
