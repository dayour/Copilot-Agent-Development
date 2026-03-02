# Fuel Tracking Agent

## Overview

**Agent Name:** Fuel Tracking  
**Vertical:** Transportation  
**Primary Users:** Fleet managers, drivers, finance analysts  
**Target Channels:** Microsoft Teams, mobile web chat

Fuel Tracking is a Copilot Studio agent designed for enterprise fleet operations. It provides near-real-time visibility into fuel spend, efficiency, and anomalies across mixed fleets (Class 8 long-haul, regional delivery, and last-mile vans). It supports operational decision-making, fraud detection workflows, and day-to-day fueling optimization.

## Business Goals

- Reduce fuel theft and waste through anomaly detection and investigation workflows
- Provide instant answers for spend, efficiency, and transaction-level questions
- Improve fueling decisions with route-aware fuel price recommendations
- Support finance controls through card operations and spend analytics

## Core Topics

- **Fuel Summary**: Aggregate fuel spend by fleet, region, and vehicle segment with budget variance
- **Vehicle Fuel Profile**: Per-vehicle MPG, fill cadence, cost-per-mile, and trend vs fleet baseline
- **Driver Efficiency Ranking**: Driver ranking based on normalized MPG and route/load context
- **Transaction Lookup**: Card- or vehicle-based transaction history with detailed records
- **Anomaly Alert**: Weekly and near-real-time suspicious events with rule and evidence metadata
- **Anomaly Investigation**: Deep investigation workflow for a specific suspicious transaction
- **Fuel Price Finder**: Nearby recommended fueling stops by price and route proximity
- **Fuel Card Management**: Fuel card state changes (for example suspend/reactivate) with confirmation

## Folder Structure

```text
transportation/
  agents/
    fuel-tracking/
      README.md
      runbook.md
      templates/
        agent-template.yaml
      solution/
        solution-definition.yaml
```

## Solution Components

- Copilot Studio agent definition and topic scaffold
- Dataverse schema for transactions, anomalies, profiles, and cards
- Power Automate flow contracts for ingestion, enrichment, and card operations
- Environment variable model for API endpoints, keys, thresholds, and alerting

