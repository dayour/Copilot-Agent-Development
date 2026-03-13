# SLA Definitions

## Overview

This document defines Service Level Agreements (SLAs) for every Copilot Studio agent in the fleet. Agents are classified into three tiers based on business criticality, user impact, and failure cost. SLA targets, monitoring obligations, and incident response requirements differ by tier.

See [coe-governance.md](./coe-governance.md) for the governance processes that enforce these definitions and [agent-registry-template.md](./agent-registry-template.md) for the registry field that records each agent's assigned tier.

---

## Tier Definitions

### Tier Classification Criteria

| Criterion | P0 | P1 | P2 |
| --- | --- | --- | --- |
| Business impact of outage | Revenue loss or regulatory exposure | Significant productivity loss | Minor inconvenience or workaround available |
| User base | External customers or regulated users | Internal users with no alternative workflow | Internal users with readily available alternatives |
| Data sensitivity | Confidential or regulated data | Internal business data | Non-sensitive operational data |
| Integration dependencies | Core line-of-business systems (CRM, claims, ERP) | Secondary business systems | Informational or read-only systems |
| Recovery complexity | Requires coordination across multiple teams | Requires IT Admin involvement | Agent owner can self-recover |

### Current Tier Assignments

| Agent | Vertical | Tier | Justification |
| --- | --- | --- | --- |
| Claims Assistant | Insurance | P0 | Handles external customers; regulatory exposure if claims processing is unavailable; integrates with claims management system |
| IT Help Desk | Tech | P1 | Internal users; no alternative for IT request routing during outage but workarounds exist (email, phone) |
| Seller Prospect | Tech | P1 | Revenue-impacting but sales reps can use CRM directly as fallback |
| SupportBot | Tech | P1 | Internal productivity; users can raise tickets via web portal as fallback |
| Policy Advisor | Tech | P1 | Internal policy guidance; users can consult SharePoint directly during outage |
| Power Platform Advisor | Tech | P1 | Internal guidance; CoE team available as fallback |
| Fleet Coordinator | Transportation | P1 | Operations-impacting; dispatch can use manual processes as short-term fallback |
| Route Optimizer | Transportation | P1 | Operational efficiency loss during outage but manual route planning is viable |
| Power Analysis | Clothing | P1 | Business intelligence delays are impactful but not immediately revenue-blocking |
| Virtual Coach | Coffee | P2 | Internal operational guidance; supervisors can cover as fallback |
| Fuel Tracking | Transportation | P2 | Reporting and logging; manual tracking sheets are a viable short-term fallback |

---

## SLA Targets

### Availability Targets

| Tier | Monthly Uptime Target | Maximum Monthly Downtime |
| --- | --- | --- |
| P0 | 99.9% | 43.2 minutes |
| P1 | 99.5% | 3.6 hours |
| P2 | 99.0% | 7.2 hours |

Uptime is measured as the percentage of time the agent is accessible and returning valid responses in the production channel. Planned maintenance windows that are communicated at least 48 hours in advance are excluded from downtime calculations.

### Performance Targets

| Metric | P0 | P1 | P2 |
| --- | --- | --- | --- |
| Response latency (p95) | Under 3 seconds | Under 5 seconds | Under 8 seconds |
| Flow execution time (p95) | Under 5 seconds | Under 10 seconds | Under 20 seconds |
| Knowledge source query time (p95) | Under 2 seconds | Under 4 seconds | Under 6 seconds |

### Quality Targets (Steady-State Production)

| Metric | P0 | P1 | P2 |
| --- | --- | --- | --- |
| Resolution rate | Above 85% | Above 80% | Above 75% |
| Escalation rate | Below 10% | Below 20% | Below 25% |
| Flow success rate | Above 99.5% | Above 99% | Above 98% |
| Unrecognized input rate | Below 10% | Below 15% | Below 20% |
| CSAT | Above 4.2 / 5.0 | Above 4.0 / 5.0 | Above 3.8 / 5.0 |

---

## Incident Response Requirements

### Response Time Targets

| Severity | Trigger Condition | Initial Response | Mitigation Target | Resolution Target |
| --- | --- | --- | --- | --- |
| P0 - Critical | Agent fully unavailable OR flow failure rate above 20% | 15 minutes | 1 hour | 4 hours |
| P0 - Degraded | Resolution rate below 60% OR response latency above 2x target | 30 minutes | 2 hours | 8 hours |
| P1 - Critical | Agent fully unavailable | 1 hour | 4 hours | 8 hours |
| P1 - Degraded | Resolution rate below 60% OR flow failure rate above 10% | 2 hours | 8 hours | 24 hours |
| P2 - Any | Any availability or quality threshold breach | Next business day | 3 business days | 5 business days |

Response times are measured from the moment the alert fires in the monitoring system, not from when a human notices the alert.

### Escalation Paths

#### P0 Escalation

```
Alert fires (automated)
  -> Agent Owner notified (Teams + email) -- 15 minutes
  -> If no acknowledgement: CoE Admin notified -- 30 minutes
  -> If no mitigation started: IT Director notified -- 1 hour
  -> If SLA breach imminent: Executive sponsor notified -- 2 hours
```

#### P1 Escalation

```
Alert fires (automated)
  -> Agent Owner notified (Teams + email) -- 1 hour
  -> If no acknowledgement: CoE Admin notified -- 2 hours
  -> If not mitigated: Vertical Lead notified -- 4 hours
```

#### P2 Escalation

```
Weekly digest to Agent Owner (automated)
  -> Agent Owner reviews and acts within 3 business days
  -> If not resolved: CoE Admin follows up
```

---

## Maintenance Windows

### Standard Maintenance Window

- Schedule: Sundays, 02:00 - 06:00 local time for the primary user base.
- Notice required: 48 hours minimum via Teams announcement in the agent support channel.
- Applies to: solution imports, environment variable updates, flow republication, channel reconfiguration.

### Emergency Maintenance

- No advance notice required for P0 incident mitigations.
- Notify users as soon as the maintenance scope is understood (within 30 minutes of start).
- Post-maintenance: publish a summary including root cause, mitigation taken, and prevention measures.

### Maintenance Exclusion Periods

The following periods are maintenance-frozen for P0 and P1 agents (no planned changes):

| Period | Exclusion |
| --- | --- |
| Business quarter-end (last 5 business days of March, June, September, December) | All planned changes blocked for P0 and P1 |
| Company-wide peak periods (agreed annually) | All planned changes blocked for all tiers |
| 48 hours after a P0 incident | No further changes until post-incident review is complete |

---

## SLA Measurement

### Data Sources

| Metric | Source |
| --- | --- |
| Availability | Power Automate scheduled probe flow (HTTP GET to agent endpoint every 5 minutes) |
| Response latency | Copilot Studio Analytics (conversation response time) |
| Resolution rate | Copilot Studio Analytics |
| Escalation rate | Copilot Studio Analytics |
| Flow success rate | Power Automate run history |
| CSAT | Post-conversation survey (Power Automate + Dataverse) |

### Reporting Cadence

| Report | Audience | Frequency |
| --- | --- | --- |
| SLA Scorecard | Agent Owners, Vertical Leads, CoE Admin | Monthly |
| Incident Summary | CoE Admin, IT Director | Monthly |
| Executive Fleet Health | Product Sponsors, IT Finance | Quarterly |

### SLA Credit and Escalation Policy

This is an internal governance framework. SLA breaches do not incur financial penalties but do trigger the following governance responses:

| Breach | Response |
| --- | --- |
| P0 availability SLA missed in a calendar month | Mandatory post-incident review; remediation plan due within 10 business days |
| P1 availability SLA missed two consecutive months | Escalation to Vertical Lead and CoE Admin; 30-day improvement plan |
| P2 quality targets missed three consecutive months | Agent Owner review with Vertical Lead; evaluate retirement or redesign |
| Any agent with zero CSAT data for 60 days | CoE Admin investigates survey collection; agent owner remediation required |

---

## Tier Promotion and Demotion

### Promotion (P2 to P1 or P1 to P0)

An agent may be promoted to a higher tier if any of the following occur:

- Business criticality increases (e.g., agent is now required for regulatory compliance or external customer service).
- Monthly Active Users grow above 500 for P2 agents or above 2,000 for P1 agents.
- A P0-level dependency is added (e.g., integration with core claims or ERP system).

Promotion requires approval from the Vertical Lead and CoE Admin. After approval, update the Tier field in the registry and apply the new SLA targets in the next monitoring cycle.

### Demotion (P0 to P1 or P1 to P2)

An agent may be demoted to a lower tier if:

- Business criticality decreases (e.g., the process it supports is no longer customer-facing).
- A reliable fallback process is established that reduces the impact of agent unavailability.

Demotion requires approval from the Vertical Lead and CoE Admin. Demotion does not relax operational monitoring; it only adjusts the response time and escalation targets.
