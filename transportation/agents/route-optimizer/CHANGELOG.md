# Changelog

All notable changes to the Route Optimizer agent will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-03-03

### Added

- ETA Update topic: delivery-order-based ETA lookup with adaptive card displaying confidence level and change delta.
- Delay Reason Logging topic and LogDelayReason flow: captures delay reasons (traffic, breakdown, weather, customer not available) to the new RouteDelays Dataverse table.
- ETA Accuracy Report topic and GetEtaAccuracyReport flow: historical accuracy metrics comparing predicted versus actual arrivals, broken down by driver, route type, and time of day.
- TrackEtaAccuracy flow: records predicted vs actual arrival per stop and computes variance for model feedback.
- GetDeliveryEta flow: resolves an order ID to vehicle and stop, then returns ETA with confidence level.
- GetTrafficConditions flow: queries traffic API for current conditions and incidents along all active route segments.
- NotifyCustomerEtaChange flow: sends email and optional SMS to the customer when ETA changes beyond the configurable EtaChangeThresholdMinutes.
- RouteDelays Dataverse table with delay_reason choice column (traffic, breakdown, weather, customer_not_available, other).
- EtaAccuracy Dataverse table with variance_minutes, confidence_level, and time_of_day columns.
- Customer contact columns on RouteStops table: order_id, customer_name, customer_email, customer_phone.
- New environment variables: EtaChangeThresholdMinutes, CustomerNotificationEmail, CustomerSmsApiUrl, CustomerSmsApiKey.
- Office365Outlook and CustomerSmsApiHttp connectors for customer notification.
- Global.EtaChangeThresholdMinutes agent variable.

### Changed

- CalculateRealTimeEta flow now returns confidenceLevel output.
- EvaluateReroutingNeed flow now returns alternativeRouteSummary, timeSavedMinutes, additionalDistanceMiles, and affectedDeliveryCount for impact assessment.
- Rerouting Alert topic now displays an impact assessment adaptive card when re-routing is triggered.

## [1.0.0] - 2026-03-02

### Added

- Initial release of the Route Optimizer agent for the Transportation vertical.
- Route planning, ETA calculation, and traffic-aware optimization topics.
- Mapping API integration via HTTP connector.
- Teams and custom website channel configuration.
