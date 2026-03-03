# Changelog

All notable changes to the Route Optimizer agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-03-03

### Added

- Order-Based Delivery Optimization topic: fetches unscheduled orders for a driver from the order management system, applies vehicle and driver constraints, and presents an optimized route with adaptive card.
- What-If Route Analysis topic: re-optimizes a route with a proposed additional stop and shows time and ETA impact without committing the change; dispatcher can accept or reject.
- Route Comparison topic: side-by-side comparison of two routes across total distance, total time, stop count, fuel cost estimate, and on-time delivery probability.
- FetchUnscheduledOrders Power Automate flow: retrieves unscheduled delivery orders from the order management system.
- WhatIfRouteAnalysis Power Automate flow: calls mapping API with a proposed stop and returns delta metrics without persisting.
- CompareRoutes Power Automate flow: retrieves metrics for two routes and returns a structured comparison.
- OrderManagementApiUrl and OrderManagementApiKey environment variables and HTTP connector.
- service_time_minutes and priority columns on the RouteStops Dataverse table.

### Changed

- OptimizeRoute flow extended with vehicleConstraints and driverConstraints inputs, totalDistanceMiles and perStopEtas outputs.
- Route Optimization topic updated to pass vehicle and driver constraints to the optimization flow and display per-stop ETAs.

## [1.0.0] - 2026-03-02

### Added

- Initial release of the Route Optimizer agent for the Transportation vertical.
- Route planning, ETA calculation, and traffic-aware optimization topics.
- Mapping API integration via HTTP connector.
- Teams and custom website channel configuration.
