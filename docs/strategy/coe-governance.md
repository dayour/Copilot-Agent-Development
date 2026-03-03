# CoE Governance Patterns for Agent Fleet

## Overview

This document defines the Center of Excellence (CoE) governance framework for managing the complete Copilot Studio agent fleet across all verticals in this repository. It establishes standards, processes, and tooling that ensure agents are developed consistently, operated reliably, and retired safely.

The CoE operates across five verticals: Coffee, Clothing, Insurance, Tech, and Transportation. Governance applies to every agent regardless of tier or audience.

---

## Governance Principles

1. Every agent has a named owner accountable for quality and operations.
2. No agent reaches production without passing all quality gates.
3. Security and compliance controls are non-negotiable and environment-independent.
4. Governance automation reduces manual overhead and prevents drift.
5. All governance artifacts are stored in source control alongside agent definitions.

---

## Agent Inventory Management

### Central Registry

The CoE maintains a central registry of every deployed and in-development agent. See [agent-registry-template.md](./agent-registry-template.md) for the registry schema and a pre-populated template.

Required registry fields per agent:

| Field | Description |
| --- | --- |
| Agent Name | Canonical name matching the repository folder |
| Vertical | Coffee, Clothing, Insurance, Tech, or Transportation |
| Owner | Named individual (not a team or alias) responsible for the agent |
| Status | Development, Testing, Staging, Production, Retired |
| Environment ID | Power Platform environment GUID for the production instance |
| Solution Version | Semantic version (major.minor.patch) of the deployed solution |
| Last Updated | Date of the most recent production promotion |
| Tier | P0, P1, or P2 -- see [sla-definitions.md](./sla-definitions.md) |
| Knowledge Source Refresh | Date of the most recent knowledge source sync |

### Automated Inventory Refresh

Run the following Power Platform CLI command weekly from the CoE automation account to refresh the registry:

```bash
pac chatbot list --environment <env-id>
```

Map the output fields to the registry schema and upsert records in the CoE Dataverse `AgentRegistry` table.

Automation schedule: every Monday at 06:00 UTC via a Power Automate scheduled cloud flow.

### Orphan Agent Detection

An agent is classified as orphan if any of the following are true:

- Owner field is empty or the named owner has left the organization.
- No production promotion in the past 180 days (status remains Production with no version bump).
- No knowledge source refresh in the past 90 days.
- No conversation activity in the past 60 days (resolution rate data absent from analytics).

Orphan detection runs alongside the weekly inventory refresh. Detected orphans trigger a Teams notification to the vertical lead and the CoE admin. The vertical lead has 14 days to either assign a new owner or initiate the retirement process.

### License Utilization Tracking

Track the following license dimensions monthly:

| Metric | Source | Target Threshold |
| --- | --- | --- |
| Copilot Studio MAU per tenant | Power Platform Admin Center | Below purchased seats |
| Power Automate Premium users | Power Platform Admin Center | Below purchased seats |
| AI Builder credits consumed | Power Platform Admin Center | Below monthly allocation |
| Dataverse storage (GB) | Power Platform Admin Center | Below allocated capacity |

Export a monthly snapshot to the `LicenseUtilization` Dataverse table. Alert the CoE admin and IT Finance when any metric exceeds 80% of the purchased allocation.

---

## Quality Standards Enforcement

### Required Scaffold Files

Every agent in production must have all four scaffold files committed to source control:

| File | Purpose |
| --- | --- |
| `README.md` | Agent overview, topics, quick-start guide |
| `runbook.md` | Prerequisites, deployment steps, monitoring, rollback |
| `templates/agent-template.yaml` | Topic definitions, trigger phrases, entities, actions |
| `solution/solution-definition.yaml` | Power Platform solution definition (import-ready) |

A pre-merge CI check validates scaffold completeness. Pull requests that are missing any scaffold file are blocked until the gap is resolved.

### Eval Pass Rates Before Production Promotion

Agents must meet the following minimum evaluation thresholds before a production promotion is approved:

| Metric | Minimum Threshold |
| --- | --- |
| UAT resolution rate | 80% |
| UAT user satisfaction (CSAT) | 4.0 / 5.0 |
| Integration test pass rate | 100% |
| Flow unit test pass rate | 100% |
| Unrecognized input rate (test set) | Below 15% |

Evidence (UAT summary, test run outputs) must be attached to the release pull request. The CoE admin reviews evidence before approving the production promotion gate.

### Knowledge Source Freshness

Knowledge sources that are more than 90 days old without a refresh are classified as stale. Stale knowledge sources block production promotion for new releases and generate a weekly alert to the content owner and agent owner.

Tracking table (maintained in the registry):

| Agent | Knowledge Source | Last Refreshed | Status |
| --- | --- | --- | --- |
| (agent name) | (SharePoint URL or document set) | (date) | Fresh / Stale |

### Instruction Quality Review

Agent instructions must follow the three-part structure:

1. **Role definition** -- Who is the agent and what is its primary function.
2. **Behavioral rules** -- Specific do and do-not rules covering tone, data handling, escalation conditions, and out-of-scope deflection.
3. **Grounding statement** -- Explicit instruction to answer only from approved knowledge sources and to state when information is unavailable.

The CoE admin reviews instruction compliance during the staging-to-production gate review. Non-compliant instructions are returned to the agent owner for remediation before promotion is approved.

---

## CoE Toolkit Integration

### Power Platform CoE Starter Kit Alignment

This governance framework extends the Power Platform CoE Starter Kit (PPSK) with agent-specific components. The following PPSK components are prerequisites:

| PPSK Component | Purpose |
| --- | --- |
| CoE Core solution | Environment inventory, app audit, flow audit |
| CoE Governance solution | DLP compliance, orphan resource detection |
| CoE Nurture solution | Maker onboarding, adoption tracking |

Import all three PPSK solutions into the CoE environment before activating agent-specific governance flows.

### Custom Components for Agent Governance

The following custom components extend PPSK for Copilot Studio agent governance:

| Component | Type | Description |
| --- | --- | --- |
| AgentRegistry | Dataverse table | Central inventory of all agents with all registry fields |
| AgentHealthDashboard | Power BI report | Fleet-wide health metrics: resolution rate, escalation rate, CSAT, freshness |
| OrphanAgentAlert | Power Automate cloud flow | Weekly orphan detection and Teams notification |
| LicenseSnapshot | Power Automate cloud flow | Monthly license utilization export to Dataverse |
| ScaffoldValidator | GitHub Actions workflow | Pre-merge check for required scaffold files |
| PromotionGateApproval | Power Automate approval flow | Triggered by pull request; routes eval evidence to CoE admin for sign-off |

### Fleet-Wide Health Dashboard

The AgentHealthDashboard Power BI report exposes the following pages:

1. **Fleet Overview** -- Agent count by vertical, tier, and status; orphan count; stale knowledge source count.
2. **Quality Metrics** -- Resolution rate, escalation rate, CSAT, and unrecognized input rate per agent.
3. **Operational Health** -- Flow success rate, knowledge source freshness, last deployment date.
4. **License Utilization** -- MAU, Dataverse storage, AI Builder credits, and Power Automate flow runs against thresholds.
5. **Security Compliance** -- DLP compliance status, authentication mode, connector certification status per agent.

Refresh schedule: daily at 07:00 UTC from the CoE automation account.

---

## Operational Excellence

### Incident Response Playbooks

| Severity | Trigger | Response Time | Escalation Path |
| --- | --- | --- | --- |
| P0 | Agent completely unavailable in production | 15 minutes | Agent Owner > CoE Admin > IT Director |
| P1 | Resolution rate drops below 60% or flow failure rate above 10% | 1 hour | Agent Owner > CoE Admin |
| P2 | Knowledge source stale, orphan detected, or scaffold violation | Next business day | Agent Owner |

For P0 incidents, follow this sequence:
1. Identify scope: is the issue isolated to one agent, one environment, or tenant-wide?
2. Apply immediate mitigation: revert to the previous solution version if a recent deployment is suspected.
3. Notify affected users via the established communication channel.
4. Open a war room (Teams meeting) with Agent Owner, IT Admin, and CoE Admin.
5. Document the incident timeline and root cause in the `IncidentLog` Dataverse table within 24 hours.
6. Conduct a blameless post-incident review within 5 business days.

### Capacity Planning and Forecasting

Review capacity monthly and forecast quarterly using the following inputs:

- Conversation volume trend (30-day and 90-day moving average per agent)
- Dataverse storage growth rate
- AI Builder credit burn rate
- Power Automate flow run volume trend

Trigger a capacity review with IT Finance if any metric is projected to exceed 80% of the current allocation within 60 days.

### Cost Allocation Per Vertical and Agent

All billable consumption is tagged by vertical and agent using Power Platform environment naming conventions (`<org>-<vertical>-<stage>`) and Dataverse record ownership. Monthly cost reports are produced per vertical using Azure Cost Management and Power Platform Admin Center exports. Costs are attributed to:

- Copilot Studio license consumption (MAU)
- Power Automate flow run volume
- Dataverse storage
- AI Builder credits
- Azure services (Key Vault, Blob Storage, Azure AD B2C)

Monthly cost allocation reports are shared with each vertical lead and IT Finance by the 5th business day of the following month.

---

## Governance Calendar

| Cadence | Activity | Owner |
| --- | --- | --- |
| Weekly (Monday) | Agent inventory refresh and orphan detection | CoE Automation |
| Weekly (Friday) | Knowledge source freshness check | CoE Admin |
| Monthly (1st) | License utilization snapshot | CoE Automation |
| Monthly (5th) | Cost allocation report distributed | CoE Admin |
| Quarterly | Full fleet health review: KPIs, roadmap, capacity | CoE Admin + Vertical Leads |
| Quarterly | Security compliance audit | Security Lead + CoE Admin |
| Annually | CoE governance framework review and update | CoE Admin + Stakeholders |

---

## Related Documents

- [Agent Registry Template](./agent-registry-template.md)
- [SLA Definitions](./sla-definitions.md)
- [Security and Compliance Checklist](./security-compliance-checklist.md)
- [Admin and Governance Guide](../admin-governance.md)
- [Agent Lifecycle](../agent-lifecycle.md)
