# Agent Analytics KPI Framework

## Overview

This document defines the standardized analytics framework for measuring agent performance across all verticals in the Copilot Agent Development repository. The framework covers five KPI categories -- Engagement, Quality, Satisfaction, Performance, and Cost -- and applies to every agent: Virtual Coach (Coffee), Power Analysis (Clothing), Claims Assistant (Insurance), Seller Prospect (Tech), IT Help Desk (Tech), Fuel Tracking (Transportation), Fleet Coordinator (Transportation), and Route Optimizer (Transportation).

All metrics are sourced from the Copilot Studio analytics API, Dataverse conversation transcripts, and Power Automate flow telemetry. The Power BI dashboard template in `docs/analytics/dashboard-template.yaml` implements the visuals described here. Alert thresholds and notification rules are defined in `docs/analytics/alerting-config.md`.

## KPI Categories

### Engagement Metrics

Engagement metrics measure the volume and shape of agent usage over time. They answer the question: how much is the agent being used, and by whom?

| Metric | Definition | Granularity | Source |
|---|---|---|---|
| Total conversations | Count of distinct conversation sessions started | Daily, weekly, monthly | Copilot Studio analytics API |
| Unique users | Count of distinct authenticated user identities | Daily, weekly, monthly | Copilot Studio analytics API |
| Average conversation length | Mean number of turns (user + agent messages) per session | Weekly | Copilot Studio transcripts |
| Peak usage hours | Distribution of session starts by hour of day (UTC) | Weekly rolling | Copilot Studio analytics API |
| Channel distribution | Percentage of sessions by channel (Teams, web, mobile, other) | Weekly | Copilot Studio analytics API |

#### Formulas

```text
TotalConversations(period) = COUNT(DISTINCT session_id) WHERE session_start >= period_start AND session_start < period_end

UniqueUsers(period) = COUNT(DISTINCT user_id) WHERE session_start >= period_start AND session_start < period_end

AvgConversationLength = AVG(turn_count) OVER all sessions in period

PeakUsageHour = MODE(HOUR(session_start_utc)) grouped by agent

ChannelDistribution(channel) = COUNT(sessions WHERE channel = channel) / COUNT(sessions) * 100
```

### Quality Metrics

Quality metrics measure how well the agent resolves user needs without human intervention. They answer the question: is the agent doing its job?

| Metric | Definition | Target | Source |
|---|---|---|---|
| Containment rate | Percentage of sessions resolved by the agent without human handoff | >= 75% | Copilot Studio analytics API |
| First-contact resolution rate | Percentage of sessions where the user's need was resolved in one session | >= 65% | Copilot Studio transcripts + outcome flag |
| Topic coverage rate | Percentage of user intents matched to a defined topic (not fallback) | >= 80% | Copilot Studio analytics API |
| Fallback rate | Percentage of sessions that triggered the Fallback system topic at least once | <= 20% | Copilot Studio analytics API |
| Escalation rate | Percentage of sessions transferred to a human agent | <= 15% | Copilot Studio analytics API |

#### Formulas

```text
ContainmentRate = (TotalConversations - EscalatedConversations) / TotalConversations * 100

FirstContactResolutionRate = ResolvedFirstSession / TotalConversations * 100

TopicCoverageRate = (TotalConversations - FallbackConversations) / TotalConversations * 100

FallbackRate = FallbackConversations / TotalConversations * 100

EscalationRate = EscalatedConversations / TotalConversations * 100
```

### Satisfaction Metrics

Satisfaction metrics measure the user's perception of the agent interaction. They answer the question: did the user get what they needed?

| Metric | Definition | Target | Source |
|---|---|---|---|
| CSAT score | Mean end-of-conversation survey score on a 1-to-5 scale | >= 3.5 | Copilot Studio CSAT topic + Dataverse |
| CSAT response rate | Percentage of sessions where the user submitted a CSAT survey response | >= 20% | Copilot Studio CSAT topic + Dataverse |
| Implied resolution rate | Percentage of sessions that ended naturally (no escalation, no abandonment) | >= 70% | Copilot Studio transcripts |
| Repeat contact rate | Percentage of users who start a new session for the same topic within 24 hours | <= 10% | Copilot Studio transcripts + user/topic correlation |

#### Formulas

```text
CSATScore = AVG(survey_score) WHERE survey_score IS NOT NULL

CSATResponseRate = COUNT(sessions WITH survey_response) / TotalConversations * 100

ImpliedResolutionRate = NaturallyEndedConversations / TotalConversations * 100
  -- NaturallyEndedConversations: sessions where last message is agent-generated and no escalation occurred

RepeatContactRate =
  COUNT(DISTINCT user_id WHERE two sessions share same topic within 24h) /
  COUNT(DISTINCT user_id) * 100
```

### Performance Metrics

Performance metrics measure the technical efficiency of the agent runtime. They answer the question: is the agent responding quickly and reliably?

| Metric | Definition | Target | Source |
|---|---|---|---|
| Average response latency | Mean time from user message to first agent token (ms) | <= 2000 ms | Power Automate flow telemetry |
| Response latency p95 | 95th percentile response latency (ms) | <= 5000 ms | Power Automate flow telemetry |
| Knowledge retrieval success rate | Percentage of knowledge source queries that returned a result | >= 90% | Copilot Studio generative answers telemetry |
| Action invocation success rate | Percentage of Power Automate flow invocations that completed successfully | >= 95% | Power Automate run history |
| System error rate | Percentage of sessions containing a system-level error (timeout, 5xx, exception) | <= 2% | Power Automate run history + Copilot Studio error logs |

#### Formulas

```text
AvgResponseLatency = AVG(response_latency_ms) over all agent turns

LatencyP95 = PERCENTILE.INC(response_latency_ms, 0.95)

KnowledgeRetrievalSuccessRate =
  COUNT(knowledge_queries WHERE result_count > 0) /
  COUNT(knowledge_queries) * 100

ActionInvocationSuccessRate =
  COUNT(flow_runs WHERE status = Succeeded) /
  COUNT(flow_runs) * 100

SystemErrorRate =
  COUNT(sessions WITH at least one system error) /
  TotalConversations * 100
```

### Cost Metrics

Cost metrics measure the financial efficiency of agent operation. They answer the question: what does the agent cost to run?

| Metric | Definition | Granularity | Source |
|---|---|---|---|
| Messages consumed | Total Copilot Studio messages billed in the period | Monthly | Power Platform Admin Center |
| Cost per conversation | Total platform cost / total conversations | Monthly | Power Platform Admin Center + Finance |
| Cost per resolution | Total platform cost / contained conversations | Monthly | Derived from containment rate + cost per conversation |
| License utilization | Percentage of provisioned message capacity consumed | Monthly | Power Platform Admin Center |
| Flow run cost | Estimated Power Automate Premium flow run cost per period | Monthly | Power Platform Admin Center |

#### Formulas

```text
CostPerConversation = TotalPlatformCost / TotalConversations

CostPerResolution = TotalPlatformCost / ContainedConversations
  -- ContainedConversations = TotalConversations * ContainmentRate

LicenseUtilization = MessagesConsumed / ProvisionedMessageCapacity * 100
```

## Per-Vertical KPI Extensions

The base KPI set above applies to all agents. Each vertical has additional domain-specific KPIs that complement the base set.

### Coffee -- Virtual Coach

| Metric | Definition | Target |
|---|---|---|
| Shift handover completion rate | Percentage of shift handover sessions that resulted in a submitted handover record | >= 90% |
| Recipe query accuracy rate | Percentage of drink recipe queries where the correct recipe was retrieved and confirmed by the user | >= 85% |
| Store lookup success rate | Percentage of store or contact lookup queries returning a valid result | >= 95% |

### Clothing -- Power Analysis

| Metric | Definition | Target |
|---|---|---|
| Average analytical sub-query count | Mean number of Dataverse or Power BI sub-queries per session (measures complexity) | Tracked, no fixed target |
| Multi-step decomposition success rate | Percentage of root-cause analysis sessions where all sub-queries completed without error | >= 90% |
| DAX query execution success rate | Percentage of DAX queries to Power BI that returned results within SLA | >= 95% |

### Insurance -- Claims Assistant

| Metric | Definition | Target |
|---|---|---|
| FNOL completion rate | Percentage of FNOL intake sessions where all required fields were captured | >= 85% |
| Fraud flag rate | Percentage of FNOL sessions flagged for fraud review by the scoring engine | Tracked, reviewed monthly |
| Compliance event log success rate | Percentage of sessions where all required compliance events were persisted | 100% |
| Regulated disclosure delivery rate | Percentage of sessions where state-required disclosures were presented to the claimant | 100% |

### Tech -- IT Help Desk

| Metric | Definition | Target |
|---|---|---|
| Ticket creation success rate | Percentage of sessions where a ServiceNow ticket was created without error | >= 98% |
| Self-service resolution rate | Percentage of sessions where the user resolved their issue via knowledge base, without ticket creation | >= 40% |
| Knowledge base coverage rate | Percentage of IT queries matched to a knowledge base article | >= 70% |

### Tech -- Seller Prospect

| Metric | Definition | Target |
|---|---|---|
| Lead qualification conversion rate | Percentage of web chat sessions that resulted in a qualified Salesforce lead | >= 15% |
| Salesforce sync success rate | Percentage of CRM operations (create, update, lookup) that completed without error | >= 98% |
| BANT completion rate | Percentage of prospect sessions where all four BANT fields (Budget, Authority, Need, Timeline) were collected | >= 60% |

### Transportation -- Fuel Tracking

| Metric | Definition | Target |
|---|---|---|
| Anomaly detection true positive rate | Percentage of flagged transactions confirmed as genuine anomalies after human review | >= 80% |
| Transaction ingestion lag | Median delay between fuel card transaction timestamp and Dataverse record creation (minutes) | <= 60 min |
| Anomaly alert delivery success rate | Percentage of anomaly events where a Teams or email alert was delivered | >= 99% |

### Transportation -- Fleet Coordinator

| Metric | Definition | Target |
|---|---|---|
| Route optimization request success rate | Percentage of route optimization sessions returning a valid plan | >= 95% |
| Telematics data freshness | Percentage of vehicle queries where telematics data is less than 15 minutes old | >= 90% |

## Data Sources and Measurement

### Copilot Studio Analytics API

The Copilot Studio analytics API provides session-level and aggregate engagement, quality, and CSAT data. Access the API via the Power Platform Analytics connector or export directly from the Copilot Studio Analytics tab.

- Base URL: `https://api.powerplatform.com/analytics/copilot/v1.0`
- Authentication: Azure AD service principal with Power Platform Admin role.
- Key endpoints: `/sessions`, `/topics`, `/outcomes`, `/csat`, `/messages`.
- Data latency: metrics are available with up to 24 hours of lag.

### Dataverse Conversation Transcripts

Detailed turn-level data for computing average conversation length, repeat contact rate, implied resolution, and per-vertical domain KPIs.

- Table: `conversationtranscript` (standard Dataverse table in Copilot Studio environments).
- Export: use a scheduled Power Automate flow to copy transcripts to an analytics Dataverse environment or Azure Blob Storage.
- Retention: 30 days default; configure extended retention per the guidance in `docs/admin-governance.md`.

### Power Automate Run History

Action invocation success rate, response latency, and system error rate are derived from Power Automate flow run telemetry.

- Source: Power Platform Admin Center > Analytics > Power Automate, or Azure Log Analytics if the environment is connected.
- Key fields: `startTime`, `endTime`, `status`, `errorCode`, `triggerName`, `flowName`.
- Latency calculation: `endTime - startTime` per flow action, correlated to the session by conversation ID.

### Power Platform Admin Center

License utilization, message consumption, and cost inputs are sourced from the Power Platform Admin Center capacity reports.

- Navigation: Power Platform Admin Center > Billing > Licenses.
- Export: download monthly capacity reports as CSV for cost calculations.

## Review Cadence

| Review Type | Frequency | Audience | Actions |
|---|---|---|---|
| Operational review | Weekly | Agent owners, IT ops | Investigate fallback, error rate, latency spikes |
| Quality review | Monthly | Vertical leads, product owners | Topic gap analysis, trigger phrase tuning, knowledge source review |
| Executive summary | Monthly | Leadership | CSAT trend, cost per resolution, adoption by vertical |
| Threshold review | Quarterly | Agent owners | Revisit alert thresholds and targets based on maturity |

## Related Documents

- `docs/analytics/dashboard-template.yaml` -- Power BI template definition for the KPI dashboard.
- `docs/analytics/alerting-config.md` -- Alert rules, thresholds, and notification runbook.
- `docs/admin-governance.md` -- Usage analytics, audit logging, cost monitoring, and DLP governance.
- `docs/connectors/health-monitoring.md` -- Connector-level health KPIs (error rate, latency, token refresh).
