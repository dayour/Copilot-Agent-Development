# Connector Health Monitoring

## Overview

This document describes the connector health monitoring solution for all agents across all verticals in this repository. The solution tracks connection status, request success and failure rates, response latency, rate limit utilization, and OAuth token refresh success.

Monitoring data flows from each agent invocation into a Dataverse SystemHealth table, a scheduled Power Automate flow proactively tests every connector endpoint, alert rules fire on threshold violations, and a Power BI report provides fleet-wide visibility.

## Monitored Dimensions

| Dimension | Description | Source |
|---|---|---|
| Connection status | authenticated, expired, or revoked | Connector response code and auth result |
| Request success/failure rate | Count of 2xx vs 4xx/5xx responses per connector | Flow run history |
| Response latency percentiles | p50, p95, p99 per connector | Flow action duration telemetry |
| Rate limit utilization | Percentage of quota consumed | Throttle response headers |
| Token refresh success rate | OAuth token refresh attempts vs successes | Auth action outcomes |

## Per-Vertical Connector Inventory

| Vertical | Agent(s) | Connector(s) |
|---|---|---|
| Coffee | Virtual Coach | SharePoint Online, custom POS API |
| Clothing | Power Analysis | ERP API, POS API, Power BI |
| Insurance | Claims Assistant | Claims Management System API, actuarial API, compliance rules API |
| Tech | IT Help Desk, Seller Prospect | ServiceNow, Azure Data Explorer, Microsoft Graph, MCP servers |
| Transportation | Fleet Coordinator, Fuel Tracking, Route Optimizer | GPS/Telematics API, Fuel Card API, Routing API |

## Dataverse SystemHealth Table

Agents write a row to the `cr_ConnectorHealth` table on every invocation. The table captures the connector identity, outcome, and latency so that Power BI can aggregate fleet-wide statistics.

### Table Schema

```yaml
table:
  logicalName: cr_connectorhealth
  displayName: Connector Health
  description: >
    Records connector invocation outcomes written by agents and health check flows.
    One row per connector call. Retained for 90 days before purge.

  columns:
    - logicalName: cr_connectorhealthid
      displayName: Connector Health ID
      type: uniqueidentifier
      isPrimaryKey: true

    - logicalName: cr_vertical
      displayName: Vertical
      type: string
      maxLength: 50
      description: "Vertical name: coffee, clothing, insurance, tech, or transportation."

    - logicalName: cr_agentname
      displayName: Agent Name
      type: string
      maxLength: 100
      description: "Logical name of the Copilot Studio agent that made the call."

    - logicalName: cr_connectorname
      displayName: Connector Name
      type: string
      maxLength: 100
      description: "Logical name of the connector or custom API."

    - logicalName: cr_connectionreference
      displayName: Connection Reference
      type: string
      maxLength: 200
      description: "Power Platform solution-aware connection reference name."

    - logicalName: cr_invocationtime
      displayName: Invocation Time
      type: datetime
      description: "UTC timestamp when the connector action was invoked."

    - logicalName: cr_connectionstatus
      displayName: Connection Status
      type: picklist
      options:
        - label: Authenticated
          value: 1
        - label: Expired
          value: 2
        - label: Revoked
          value: 3
        - label: Unknown
          value: 4

    - logicalName: cr_httpstatuscode
      displayName: HTTP Status Code
      type: integer
      description: "HTTP response status code returned by the connector."

    - logicalName: cr_issuccess
      displayName: Is Success
      type: boolean
      description: "True if the connector call returned a 2xx status code."

    - logicalName: cr_latencyms
      displayName: Latency (ms)
      type: integer
      description: "Round-trip latency in milliseconds for the connector action."

    - logicalName: cr_ratelimitremaining
      displayName: Rate Limit Remaining
      type: integer
      description: "Remaining quota units from the connector response headers, if available."

    - logicalName: cr_ratelimittotal
      displayName: Rate Limit Total
      type: integer
      description: "Total quota allocation from the connector response headers, if available."

    - logicalName: cr_istokenrefresh
      displayName: Is Token Refresh
      type: boolean
      description: "True if this row represents an OAuth token refresh attempt."

    - logicalName: cr_tokenrefreshsuccess
      displayName: Token Refresh Success
      type: boolean
      description: "True if the OAuth token refresh succeeded. Null if not a token refresh event."

    - logicalName: cr_errorcode
      displayName: Error Code
      type: string
      maxLength: 50
      description: "Connector or API error code, if the call failed."

    - logicalName: cr_errormessage
      displayName: Error Message
      type: string
      maxLength: 500
      description: "Truncated error message for diagnostic use. Capped at 500 characters by the WriteConnectorHealthRecord flow and the connector-health-check.py tool."

    - logicalName: cr_correlationid
      displayName: Correlation ID
      type: string
      maxLength: 100
      description: "Power Automate flow run correlation ID for end-to-end trace."

  indexes:
    - columns: [cr_vertical, cr_connectorname, cr_invocationtime]
      description: "Primary analytics index for vertical and connector time-series queries."
    - columns: [cr_issuccess, cr_invocationtime]
      description: "Index for failure-rate aggregation queries."

  retentionPolicy:
    days: 90
    purgeAction: hard_delete
    implementation: >
      Configure the Dataverse table bulk delete job in the Power Platform Admin
      Center (Settings > Data Management > Bulk Record Deletion). Create a
      recurring job that deletes rows where cr_InvocationTime is older than 90
      days. Alternatively, use a scheduled Power Automate flow with a
      DeleteRows action filtered on cr_InvocationTime.
```

### Write Pattern

Every Power Automate flow that invokes a connector should call a shared child flow, `WriteConnectorHealthRecord`, immediately after each connector action completes. Pass the action result, latency, and response metadata as inputs.

```text
[Connector Action] --> Capture: statusCode, latencyMs, rateLimitHeaders, errorCode
                   --> Call child flow: WriteConnectorHealthRecord
                   --> WriteConnectorHealthRecord creates row in cr_ConnectorHealth
```

For OAuth connectors, also write a token-refresh row when the auth action executes. Set `cr_IsTokenRefresh = true` and `cr_TokenRefreshSuccess` based on the action outcome.

## Power Automate Health Check Flow

A scheduled flow, `ConnectorHealthCheckScheduled`, runs every 15 minutes. It tests a probe endpoint for each registered connector and writes the result to the `cr_ConnectorHealth` table.

### Flow Design

```yaml
flow:
  name: ConnectorHealthCheckScheduled
  trigger:
    type: recurrence
    interval: 15
    frequency: minute

  steps:
    - name: InitializeConnectorList
      type: initialize_variable
      variable: ConnectorProbes
      value:
        - vertical: coffee
          agent: virtual-coach
          connector: sharepoint_online
          connectionReference: cr_sharepoint_coffee
          probeAction: GetItems
          probeListUrl: "${CoffeeHealthProbeListUrl}"

        - vertical: coffee
          agent: virtual-coach
          connector: custom_pos_api
          connectionReference: cr_pos_coffee
          probeAction: GetStatus
          probeEndpoint: "${CoffeePosApiBaseUrl}/health"

        - vertical: clothing
          agent: power-analysis
          connector: erp_api
          connectionReference: cr_erp_clothing
          probeAction: GetStatus
          probeEndpoint: "${ClothingErpApiBaseUrl}/health"

        - vertical: clothing
          agent: power-analysis
          connector: pos_api
          connectionReference: cr_pos_clothing
          probeAction: GetStatus
          probeEndpoint: "${ClothingPosApiBaseUrl}/health"

        - vertical: clothing
          agent: power-analysis
          connector: power_bi
          connectionReference: cr_powerbi_clothing
          probeAction: GetReportEmbedUrl
          probeReportId: "${ClothingPowerBiProbeReportId}"

        - vertical: insurance
          agent: claims-assistant
          connector: claims_management_api
          connectionReference: cr_claims_insurance
          probeAction: GetStatus
          probeEndpoint: "${InsuranceClaimsApiBaseUrl}/health"

        - vertical: insurance
          agent: claims-assistant
          connector: actuarial_api
          connectionReference: cr_actuarial_insurance
          probeAction: GetStatus
          probeEndpoint: "${InsuranceActuarialApiBaseUrl}/health"

        - vertical: insurance
          agent: claims-assistant
          connector: compliance_api
          connectionReference: cr_compliance_insurance
          probeAction: GetStatus
          probeEndpoint: "${InsuranceComplianceApiBaseUrl}/health"

        - vertical: tech
          agent: it-help-desk
          connector: servicenow
          connectionReference: cr_servicenow_tech
          probeAction: GetStatus
          probeEndpoint: "${TechServiceNowBaseUrl}/api/now/table/sys_user?sysparm_limit=1"

        - vertical: tech
          agent: it-help-desk
          connector: azure_data_explorer
          connectionReference: cr_adx_tech
          probeAction: RunQuery
          probeDatabase: "${TechAdxDatabase}"
          probeQuery: "print 'health'"

        - vertical: tech
          agent: seller-prospect
          connector: microsoft_graph
          connectionReference: cr_graph_tech
          probeAction: GetUser
          probeUserId: "${TechGraphProbeUserId}"

        - vertical: transportation
          agent: fleet-coordinator
          connector: telematics_api
          connectionReference: cr_telematics_transport
          probeAction: GetStatus
          probeEndpoint: "${TransportTelematicsBaseUrl}/health"

        - vertical: transportation
          agent: fuel-tracking
          connector: fuel_card_api
          connectionReference: cr_fuelcard_transport
          probeAction: GetStatus
          probeEndpoint: "${TransportFuelCardApiBaseUrl}/health"

        - vertical: transportation
          agent: route-optimizer
          connector: routing_api
          connectionReference: cr_routing_transport
          probeAction: GetStatus
          probeEndpoint: "${TransportRoutingApiBaseUrl}/health"

    - name: ForEachProbe
      type: apply_to_each
      input: "@variables('ConnectorProbes')"
      steps:
        - name: RecordStartTime
          type: initialize_variable
          variable: ProbeStartMs
          value: "@ticks(utcNow())"

        - name: ExecuteProbe
          type: try_catch
          try:
            - name: InvokeConnector
              type: http_or_connector_action
              dynamicFromProbeConfig: true

          catch:
            - name: SetProbeFailure
              type: set_variable
              variable: ProbeOutcome
              value:
                isSuccess: false
                httpStatusCode: 0
                errorCode: "@{error()['code']}"
                errorMessage: "@{substring(error()['message'], 0, 500)}"

        - name: CalculateLatency
          type: compose
          value: "@div(sub(ticks(utcNow()), variables('ProbeStartMs')), 10000)"

        - name: WriteHealthRecord
          type: create_row
          table: cr_connectorhealth
          row:
            cr_vertical: "@{item()['vertical']}"
            cr_agentname: "@{item()['agent']}"
            cr_connectorname: "@{item()['connector']}"
            cr_connectionreference: "@{item()['connectionReference']}"
            cr_invocationtime: "@utcNow()"
            cr_httpstatuscode: "@{variables('ProbeOutcome')['httpStatusCode']}"
            cr_issuccess: "@{variables('ProbeOutcome')['isSuccess']}"
            cr_latencyms: "@int(outputs('CalculateLatency'))"
            cr_errorcode: "@{variables('ProbeOutcome')['errorCode']}"
            cr_errormessage: "@{variables('ProbeOutcome')['errorMessage']}"
            cr_correlationid: "@{workflow()['run']['name']}"
```

### Environment Variables for Health Check Flow

```yaml
environmentVariables:
  - name: CoffeeHealthProbeListUrl
    type: string
  - name: CoffeePosApiBaseUrl
    type: string
  - name: ClothingErpApiBaseUrl
    type: string
  - name: ClothingPosApiBaseUrl
    type: string
  - name: ClothingPowerBiProbeReportId
    type: string
  - name: InsuranceClaimsApiBaseUrl
    type: string
  - name: InsuranceActuarialApiBaseUrl
    type: string
  - name: InsuranceComplianceApiBaseUrl
    type: string
  - name: TechServiceNowBaseUrl
    type: string
  - name: TechAdxDatabase
    type: string
  - name: TechGraphProbeUserId
    type: string
  - name: TransportTelematicsBaseUrl
    type: string
  - name: TransportFuelCardApiBaseUrl
    type: string
  - name: TransportRoutingApiBaseUrl
    type: string
```

## Alert Rules

Alert rules are implemented as additional steps in the `ConnectorHealthCheckScheduled` flow. After all probes complete, aggregation queries run against `cr_ConnectorHealth` and notifications fire when thresholds are exceeded.

| Alert | Condition | Notification Channel | Severity |
|---|---|---|---|
| Authentication expired or revoked | `cr_ConnectionStatus` is Expired or Revoked | Teams Operations channel, Outlook | Critical |
| High error rate | Error rate > 10% over last 60 minutes for any connector | Teams Operations channel | High |
| High latency | p95 latency > 5000 ms over last 60 minutes for any connector | Teams Operations channel | Medium |
| Rate limit approaching | Rate limit utilization >= 80% | Teams Operations channel | Medium |
| Token refresh failure | Token refresh success rate < 100% in last 15 minutes | Teams Operations channel, Outlook | High |

### Alert Flow Logic

```text
After all probes complete:

1. Query cr_ConnectorHealth WHERE InvocationTime >= utcNow() minus 60 minutes
2. Group by Vertical, ConnectorName
3. For each group:
   a. If any row has ConnectionStatus = Expired or Revoked:
      --> Post Teams alert: "AUTH EXPIRED: {vertical}/{connector}"
      --> Send Outlook email to connector owner alias
   b. If (FailureCount / TotalCount) > 0.10:
      --> Post Teams alert: "HIGH ERROR RATE: {vertical}/{connector} at {rate}%"
   c. If p95(LatencyMs) > 5000:
      --> Post Teams alert: "HIGH LATENCY: {vertical}/{connector} p95={latency}ms"
   d. If any row has (RateLimitTotal > 0) AND ((RateLimitTotal - RateLimitRemaining) / RateLimitTotal) >= 0.80:
      --> Post Teams alert: "RATE LIMIT: {vertical}/{connector} at {utilization}%"
4. Query token refresh rows from last 15 minutes
5. If TokenRefreshSuccess = false for any row:
   --> Post Teams alert: "TOKEN REFRESH FAILED: {vertical}/{connector}"
   --> Send Outlook email to connector owner alias
```

## Power BI Dashboard

The connector health Power BI report provides fleet-wide connector health visibility. It connects directly to the Dataverse `cr_ConnectorHealth` table using a Power Platform Dataverse connector.

See `tools/connector-health-dashboard.yaml` for the full report template definition including data model, measures, and page layouts.

### Report Pages

| Page | Purpose |
|---|---|
| Fleet Overview | Single-pane health status across all verticals and connectors |
| Error Rate Trends | Time-series charts of error rates per connector over 7 and 30 days |
| Latency Percentiles | p50, p95, p99 latency charts per connector with threshold reference lines |
| Rate Limit Utilization | Current quota consumption per connector with utilization gauge visuals |
| Auth and Token Health | OAuth token refresh success rate and connection status breakdowns |
| Incident Log | Tabular drill-through of failed invocations with correlation IDs |

### Key DAX Measures

```text
ErrorRate =
DIVIDE(
    CALCULATE(COUNTROWS(cr_connectorhealth), cr_connectorhealth[cr_issuccess] = FALSE()),
    COUNTROWS(cr_connectorhealth),
    0
)

LatencyP95 =
PERCENTILE.INC(cr_connectorhealth[cr_latencyms], 0.95)

LatencyP99 =
PERCENTILE.INC(cr_connectorhealth[cr_latencyms], 0.99)

LatencyP50 =
PERCENTILE.INC(cr_connectorhealth[cr_latencyms], 0.50)

RateLimitUtilizationPct =
DIVIDE(
    CALCULATE(
        SUMX(cr_connectorhealth,
            cr_connectorhealth[cr_ratelimittotal] - cr_connectorhealth[cr_ratelimitremaining]
        ),
        cr_connectorhealth[cr_ratelimittotal] > 0
    ),
    CALCULATE(SUM(cr_connectorhealth[cr_ratelimittotal]), cr_connectorhealth[cr_ratelimittotal] > 0),
    0
)

TokenRefreshSuccessRate =
DIVIDE(
    CALCULATE(COUNTROWS(cr_connectorhealth),
        cr_connectorhealth[cr_istokenrefresh] = TRUE(),
        cr_connectorhealth[cr_tokenrefreshsuccess] = TRUE()
    ),
    CALCULATE(COUNTROWS(cr_connectorhealth),
        cr_connectorhealth[cr_istokenrefresh] = TRUE()
    ),
    1
)
```

## Operational Runbook

### Responding to an Auth Expired Alert

1. Identify the connector and connection reference from the alert message.
2. Open Power Platform Admin Center > Environments > target environment > Connections.
3. Locate the connection reference. Re-authenticate using the appropriate service account.
4. Verify by re-running the probe step in `ConnectorHealthCheckScheduled` manually.
5. Confirm `cr_ConnectionStatus` returns to Authenticated in the next scheduled run.

### Responding to a High Error Rate Alert

1. Open Power Automate run history for the affected connector.
2. Identify the error pattern: HTTP status code, error code, error message.
3. Check the downstream API status page and recent incident reports.
4. If transient: confirm exponential backoff retry is configured on the connector action.
5. If persistent: escalate to the connector owner or API provider.

### Responding to a High Latency Alert

1. Open the latency trend chart in the Power BI report for the affected connector.
2. Determine if latency is increasing over time (infrastructure issue) or spiking (burst traffic).
3. Review payload sizes and query complexity in the relevant flow actions.
4. Consider enabling pagination, caching frequent reads, or moving to async patterns.

### Responding to a Rate Limit Alert

1. Check the rate limit utilization gauge in the Power BI report.
2. Review the call pattern in flow run history for the affected connector.
3. Apply exponential backoff and reduce parallel branch concurrency where possible.
4. Contact the API provider to request quota increase if sustained load requires it.

### Responding to a Token Refresh Failure Alert

1. Identify the OAuth connection reference from the alert.
2. Check whether the client secret or refresh token has expired.
3. Rotate credentials using the documented credential rotation process.
4. Re-authenticate the connection in Power Platform Admin Center.
5. Monitor the next 15-minute probe cycle to confirm recovery.

## Integration with Agent Flows

Each vertical's Power Automate flows should wrap connector actions with health telemetry using the shared `WriteConnectorHealthRecord` child flow. The following shows the pattern for a connector action in any flow.

```text
Before action: capture utcNow() as StartTime
Invoke connector action
After action:
  Compute LatencyMs = ticks(utcNow()) - ticks(StartTime) / 10000
  Extract: StatusCode, RateLimitRemaining, RateLimitTotal from response headers
  On success: IsSuccess = true, ConnectionStatus = Authenticated
  On 401/403: IsSuccess = false, ConnectionStatus = Expired or Revoked
  On 429: IsSuccess = false, capture RateLimitRemaining
  Call WriteConnectorHealthRecord with all captured values
```

This pattern is enforced at solution import time through flow template pre-configuration. See `tools/connector-health-check.py` for a portable command-line tool that performs equivalent checks outside of Power Platform.
