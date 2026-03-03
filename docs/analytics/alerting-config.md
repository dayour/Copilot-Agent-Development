# Agent Analytics Alerting Configuration

## Overview

This document defines the alert rules, thresholds, notification channels, and operational runbook for agent analytics KPIs across all verticals. Alerts are implemented as additional steps in the `AgentAnalyticsAlertScheduled` Power Automate flow, which runs daily after the `AgentAnalyticsAggregationScheduled` flow populates the `cr_AgentAnalyticsMetrics` Dataverse table.

All threshold values are calibrated for agents at general availability maturity. Review thresholds quarterly as agents improve. Threshold adjustment history should be tracked in this document under the Threshold Change Log section.

Related documents:

- `docs/analytics/kpi-framework.md` -- KPI definitions, formulas, and targets.
- `docs/analytics/dashboard-template.yaml` -- Power BI template with conditional formatting that mirrors these thresholds.
- `docs/admin-governance.md` -- DLP governance, audit logging, and cost monitoring.

## Alert Rules

### Fallback Rate Alert

| Property | Value |
|---|---|
| Alert name | HighFallbackRate |
| Severity | High |
| Condition | Fallback rate > 20% over the preceding 7 days for any agent |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel, Outlook (agent owner alias) |
| Auto-resolve | Yes, when fallback rate drops below 18% for 3 consecutive days |

**Diagnostic guidance.** A high fallback rate indicates that users are asking questions the agent does not have a topic for. Investigate by reviewing the unmatched utterances report in Copilot Studio Analytics and compare against the topic list. Common root causes: missing trigger phrases, out-of-scope user queries, and knowledge source gaps.

**Remediation steps.**
1. Open the Copilot Studio Analytics tab for the affected agent.
2. Navigate to Topics > Escalation/Fallback and review the top unrecognized utterances.
3. Identify the intent pattern and map it to an existing topic by adding trigger phrases, or create a new topic.
4. If the utterances are genuinely out of scope, update the Fallback topic response to guide users to the correct channel.
5. Publish the updated agent and monitor the fallback rate for 3 days.

### Escalation Rate Alert

| Property | Value |
|---|---|
| Alert name | HighEscalationRate |
| Severity | High |
| Condition | Escalation rate > 15% over the preceding 7 days for any agent |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel, Outlook (agent owner alias) |
| Auto-resolve | Yes, when escalation rate drops below 12% for 3 consecutive days |

**Diagnostic guidance.** A high escalation rate may indicate that the agent is correctly routing complex cases to humans (expected) or that users are proactively abandoning the agent due to poor quality responses (undesired). Differentiate by comparing escalation rate with CSAT score and containment rate. If CSAT is above 3.5 and escalation is high, review whether the escalation trigger conditions are correctly calibrated.

**Remediation steps.**
1. Review the escalation topic conditions in Copilot Studio.
2. Check whether escalations are user-initiated ("talk to a person") or agent-initiated (complexity threshold exceeded).
3. For agent-initiated escalations: review whether the complexity threshold needs adjustment.
4. For user-initiated escalations: investigate preceding conversation turns for low-quality or incomplete responses.
5. If escalation is appropriate (high-complexity cases), no change is needed -- update the alert comment to note the expected rate.

### CSAT Score Alert

| Property | Value |
|---|---|
| Alert name | LowCSATScore |
| Severity | High |
| Condition | Mean CSAT score < 3.5 over the preceding 14 days for any agent (minimum 20 responses required) |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel, Outlook (agent owner and vertical lead) |
| Auto-resolve | Yes, when CSAT score is >= 3.6 for 7 consecutive days |

**Diagnostic guidance.** Low CSAT can result from inaccurate responses, slow response times, unhelpful fallback messages, or broken actions. Correlate CSAT with the system error rate and response latency to narrow the root cause. Review low-scoring transcripts manually for qualitative patterns.

**Remediation steps.**
1. Export transcripts for sessions with CSAT score <= 2 from Dataverse or Copilot Studio.
2. Identify the most common complaint patterns in the transcripts.
3. If response accuracy is the issue: update knowledge sources or topic responses.
4. If latency is the issue: investigate Power Automate flow performance per `docs/connectors/health-monitoring.md`.
5. If the Fallback topic response is the issue: rewrite the fallback message to be more helpful.
6. Monitor CSAT score for 7 days after changes.

### System Error Rate Alert

| Property | Value |
|---|---|
| Alert name | HighSystemErrorRate |
| Severity | Critical |
| Condition | System error rate > 2% over the preceding 24 hours for any agent |
| Evaluation frequency | Hourly |
| Notification channel | Teams Operations channel (critical), Outlook (agent owner, IT ops) |
| Auto-resolve | Yes, when system error rate drops below 1% for 2 consecutive hours |

**Diagnostic guidance.** System errors include Power Automate flow failures, connector timeouts, and Dataverse write errors. Cross-reference with the connector health dashboard (`docs/connectors/health-monitoring.md`) to identify whether the error originates in a specific connector. Check Power Automate run history for the affected flow.

**Remediation steps.**
1. Open Power Automate run history and filter for failed runs in the affected time window.
2. Identify the failing action and the error code.
3. If the error is a connector timeout: review connector health per `docs/connectors/health-monitoring.md`.
4. If the error is a Dataverse write failure: check Dataverse capacity and table permissions.
5. If the error is a downstream API failure: escalate to the API provider.
6. Enable exponential backoff retry on the failing connector action if not already configured.

### Response Latency Alert

| Property | Value |
|---|---|
| Alert name | HighResponseLatency |
| Severity | Medium |
| Condition | p95 response latency > 5000 ms over the preceding 24 hours for any agent |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel |
| Auto-resolve | Yes, when p95 latency drops below 4500 ms for 2 consecutive days |

**Remediation steps.**
1. Open the Performance Metrics page in the analytics dashboard and identify the affected agent.
2. Check whether latency increase coincides with a deployment or a load spike.
3. Review Power Automate flow action durations for the affected agent's flows.
4. Optimize slow connector actions: enable pagination, cache static lookups, or move to async patterns.
5. If the issue is cross-cutting, check the Power Platform service health dashboard.

### Knowledge Retrieval Success Rate Alert

| Property | Value |
|---|---|
| Alert name | LowKnowledgeRetrievalSuccessRate |
| Severity | Medium |
| Condition | Knowledge retrieval success rate < 90% over the preceding 7 days for any agent |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel, Outlook (agent owner) |
| Auto-resolve | Yes, when success rate is >= 90% for 3 consecutive days |

**Remediation steps.**
1. Review generative answer telemetry in Copilot Studio for the affected agent.
2. Check whether knowledge source documents are accessible and up to date.
3. For SharePoint knowledge sources: verify indexing status and permissions.
4. For Dataverse knowledge: verify query filters and record availability.
5. Re-index knowledge sources or update the knowledge source configuration.

### Action Invocation Success Rate Alert

| Property | Value |
|---|---|
| Alert name | LowActionInvocationSuccessRate |
| Severity | High |
| Condition | Action invocation success rate < 95% over the preceding 7 days for any agent |
| Evaluation frequency | Daily |
| Notification channel | Teams Operations channel, Outlook (agent owner) |
| Auto-resolve | Yes, when success rate is >= 96% for 3 consecutive days |

**Remediation steps.**
1. Open Power Automate run history and identify the failing flow.
2. Review the connector health dashboard for the connectors used by that flow.
3. Investigate whether credential expiry, quota exhaustion, or API changes are the root cause.
4. Apply fixes per the connector health runbook in `docs/connectors/health-monitoring.md`.

### Repeat Contact Rate Alert

| Property | Value |
|---|---|
| Alert name | HighRepeatContactRate |
| Severity | Medium |
| Condition | Repeat contact rate > 10% over the preceding 14 days for any agent |
| Evaluation frequency | Weekly |
| Notification channel | Teams Operations channel, Outlook (agent owner) |
| Auto-resolve | Yes, when repeat contact rate drops below 8% for 7 consecutive days |

**Remediation steps.**
1. Identify the topics most frequently associated with repeat contacts by querying the `conversationtranscript` table.
2. Review transcript content for those topics to identify what the agent failed to resolve.
3. Improve topic responses, knowledge source content, or action outcomes for identified topics.

## Alert Thresholds Summary

| Alert | Metric | Threshold | Severity | Frequency |
|---|---|---|---|---|
| HighFallbackRate | Fallback rate | > 20% (7-day) | High | Daily |
| HighEscalationRate | Escalation rate | > 15% (7-day) | High | Daily |
| LowCSATScore | CSAT score | < 3.5 (14-day, min 20 responses) | High | Daily |
| HighSystemErrorRate | System error rate | > 2% (24-hour) | Critical | Hourly |
| HighResponseLatency | p95 latency | > 5000 ms (24-hour) | Medium | Daily |
| LowKnowledgeRetrievalSuccessRate | Knowledge retrieval success | < 90% (7-day) | Medium | Daily |
| LowActionInvocationSuccessRate | Action invocation success | < 95% (7-day) | High | Daily |
| HighRepeatContactRate | Repeat contact rate | > 10% (14-day) | Medium | Weekly |

## Power Automate Alert Flow

The `AgentAnalyticsAlertScheduled` flow evaluates all alert rules after the daily aggregation flow completes.

```yaml
flow:
  name: AgentAnalyticsAlertScheduled
  trigger:
    type: recurrence
    interval: 1
    frequency: day
    startTime: "02:00:00"
    timeZone: "UTC"
    description: "Runs 1 hour after AgentAnalyticsAggregationScheduled completes."

  steps:
    - name: QueryFallbackRateByAgent
      type: dataverse_list_rows
      table: cr_agentanalyticsmetrics
      filter: "cr_date ge @{addDays(utcNow(), -7)}"
      description: "addDays with a negative integer selects dates in the past. -7 = 7 days ago."
      aggregation:
        groupBy: [cr_agentname, cr_vertical]
        compute:
          FallbackRateAvg: DIVIDE(SUM(cr_fallbackconversations), SUM(cr_totalconversations))

    - name: EvaluateFallbackThreshold
      type: apply_to_each
      input: "@outputs('QueryFallbackRateByAgent')"
      condition: "item()['FallbackRateAvg'] > 0.20"
      action:
        - type: post_teams_message
          channel: "${OperationsTeamsChannelId}"
          message: >
            ALERT: HighFallbackRate -- Agent: {cr_agentname} ({cr_vertical})
            Fallback rate: {FallbackRateAvg}% (7-day average)
            Threshold: 20%
            Action: Review unmatched utterances in Copilot Studio Analytics.
            Runbook: docs/analytics/alerting-config.md#fallback-rate-alert

    - name: QueryEscalationRateByAgent
      type: dataverse_list_rows
      table: cr_agentanalyticsmetrics
      filter: "cr_date ge @{addDays(utcNow(), -7)}"
      aggregation:
        groupBy: [cr_agentname, cr_vertical]
        compute:
          EscalationRateAvg: DIVIDE(SUM(cr_escalatedconversations), SUM(cr_totalconversations))

    - name: EvaluateEscalationThreshold
      type: apply_to_each
      input: "@outputs('QueryEscalationRateByAgent')"
      condition: "item()['EscalationRateAvg'] > 0.15"
      action:
        - type: post_teams_message
          channel: "${OperationsTeamsChannelId}"
          message: >
            ALERT: HighEscalationRate -- Agent: {cr_agentname} ({cr_vertical})
            Escalation rate: {EscalationRateAvg}% (7-day average)
            Threshold: 15%
            Action: Review escalation topic conditions in Copilot Studio.
            Runbook: docs/analytics/alerting-config.md#escalation-rate-alert

    - name: QueryCSATByAgent
      type: dataverse_list_rows
      table: cr_agentanalyticsmetrics
      filter: "cr_date ge @{addDays(utcNow(), -14)}"
      aggregation:
        groupBy: [cr_agentname, cr_vertical]
        compute:
          CSATScoreMean: DIVIDE(SUM(cr_csatscoresum), SUM(cr_csatresponsesreceived))
          TotalCSATResponses: SUM(cr_csatresponsesreceived)

    - name: EvaluateCSATThreshold
      type: apply_to_each
      input: "@outputs('QueryCSATByAgent')"
      condition: "item()['TotalCSATResponses'] >= 20 AND item()['CSATScoreMean'] < 3.5"
      action:
        - type: post_teams_message
          channel: "${OperationsTeamsChannelId}"
          message: >
            ALERT: LowCSATScore -- Agent: {cr_agentname} ({cr_vertical})
            CSAT score: {CSATScoreMean} (14-day mean, {TotalCSATResponses} responses)
            Threshold: 3.5
            Action: Review low-scoring transcripts and identify response quality issues.
            Runbook: docs/analytics/alerting-config.md#csat-score-alert

    - name: QuerySystemErrorRateByAgent
      type: dataverse_list_rows
      table: cr_agentanalyticsmetrics
      filter: "cr_date ge @{addDays(utcNow(), -1)}"
      aggregation:
        groupBy: [cr_agentname, cr_vertical]
        compute:
          SystemErrorRateAvg: DIVIDE(SUM(cr_systemerrors), SUM(cr_totalconversations))

    - name: EvaluateSystemErrorThreshold
      type: apply_to_each
      input: "@outputs('QuerySystemErrorRateByAgent')"
      condition: "item()['SystemErrorRateAvg'] > 0.02"
      action:
        - type: post_teams_message
          channel: "${OperationsTeamsChannelId}"
          message: >
            CRITICAL: HighSystemErrorRate -- Agent: {cr_agentname} ({cr_vertical})
            System error rate: {SystemErrorRateAvg}% (24-hour)
            Threshold: 2%
            Action: Investigate Power Automate run history immediately.
            Runbook: docs/analytics/alerting-config.md#system-error-rate-alert
        - type: send_email
          to: "${AgentOwnerEmailAlias}"
          subject: "CRITICAL: High System Error Rate -- {cr_agentname}"
          body: >
            System error rate for {cr_agentname} has exceeded 2% in the last 24 hours.
            Current rate: {SystemErrorRateAvg}%.
            Please investigate Power Automate run history and connector health immediately.
            Runbook: docs/analytics/alerting-config.md#system-error-rate-alert
```

## Environment Variables

The `AgentAnalyticsAlertScheduled` flow uses the following environment variables. Configure these in the Power Platform solution before deployment.

```yaml
environmentVariables:
  - name: OperationsTeamsChannelId
    type: string
    description: "Teams channel ID for the Operations notification channel."

  - name: AgentOwnerEmailAlias
    type: string
    description: "Email alias for the agent owner group. Receives critical and high-severity alerts."

  - name: VerticalLeadEmailAlias
    type: string
    description: "Email alias for vertical leads. Receives CSAT and quality alerts."
```

## Per-Vertical Alert Extensions

The following per-vertical alert rules supplement the cross-cutting rules above.

### Coffee -- Virtual Coach

| Alert | Condition | Severity |
|---|---|---|
| ShiftHandoverCompletionRateLow | Shift handover completion rate < 80% (7-day) | Medium |
| StoreDirectoryLookupFailureHigh | Store lookup success rate < 90% (7-day) | Medium |

### Insurance -- Claims Assistant

| Alert | Condition | Severity |
|---|---|---|
| ComplianceEventLogFailure | Compliance event log success rate < 100% (any day) | Critical |
| FNOLCompletionRateLow | FNOL completion rate < 75% (7-day) | High |

### Tech -- IT Help Desk

| Alert | Condition | Severity |
|---|---|---|
| TicketCreationFailureHigh | Ticket creation success rate < 95% (7-day) | High |

### Tech -- Seller Prospect

| Alert | Condition | Severity |
|---|---|---|
| SalesforceSyncFailureHigh | Salesforce sync success rate < 95% (7-day) | High |

### Transportation -- Fuel Tracking

| Alert | Condition | Severity |
|---|---|---|
| TransactionIngestionLagHigh | Median transaction ingestion lag > 60 minutes (24-hour) | High |
| AnomalyAlertDeliveryFailure | Anomaly alert delivery success rate < 99% (24-hour) | Critical |

## Threshold Change Log

Track all changes to alert thresholds in this table. Include the date, the changed threshold, the old value, the new value, and the rationale.

| Date | Alert | Old Threshold | New Threshold | Rationale |
|---|---|---|---|---|
| 2026-03-01 | All alerts | N/A | Initial values | Initial framework release. Thresholds based on Copilot Studio product guidance and industry benchmarks. Review after 90 days of production data. |
