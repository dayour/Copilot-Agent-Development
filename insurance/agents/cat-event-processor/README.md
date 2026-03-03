# CAT Event Processor — Bulk Claims Processing for Catastrophe Events

The CAT Event Processor is a Microsoft Copilot Studio solution for large Property and Casualty carriers that need to manage mass claims intake and adjuster operations during declared catastrophe events such as hurricanes, wildfires, and floods.

## Solution Scope

| Field | Value |
|-------|-------|
| Agent Name | CAT Event Processor |
| Industry | Property and Casualty Insurance |
| Lines of Business | Property, Auto, Casualty |
| Primary Users | Claims managers and supervisors (internal), Policyholders in affected areas (external) |
| Target Outcomes | Streamlined mass FNOL intake, severity-based triage, real-time CAT dashboard visibility, proactive policyholder outreach |
| Core Runtime | Microsoft Copilot Studio + Dataverse + Power Automate |

## Agent vs Human Decision Boundary

| CAT Activity | Agent Ownership | Human Required | Notes |
|--------------|----------------|----------------|-------|
| CAT event declaration and activation | Yes | Approval required | Claims manager initiates via agent; supervisor approval gates activation |
| Bulk FNOL intake (streamlined) | Yes | No | Reduced required fields in CAT mode; batch record creation |
| CAT dashboard retrieval | Yes | No | Real-time read from Dataverse aggregates |
| Automated severity triage | Yes | Conditional | Agent classifies total loss and major damage; human confirms total loss valuation |
| Proactive policyholder outreach dispatch | Yes | No | Flow identifies policyholders in affected geography and sends outreach messages |
| Total loss valuation and settlement | No | Yes | Licensed adjuster required for final settlement authorization |
| Coverage denial during CAT event | No | Yes | Human-controlled regulatory control point |
| CAT event deactivation | Yes | Approval required | Claims manager initiates; system reverts to standard SLA controls |

## Key Capabilities

### CAT Event Declaration Flow

Claims managers declare a named catastrophe event (hurricane, wildfire, flood, hail, tornado) through the agent. Declaration activates special handling rules:

- Relaxed documentation requirements during the initial surge period
- Expedited claim routing and adjuster auto-assignment
- Pre-approved vendor list activation for emergency repairs and temporary housing
- Temporary SLA policy overrides approved by compliance

### Bulk FNOL Intake

The agent switches to a streamlined intake mode that reduces required fields and supports rapid data capture:

- Minimum viable intake: policy number, loss location, loss description, contact information
- Optional supplementary fields presented after core submission
- Batch record creation via Power Automate flow to handle high-volume ingestion

### CAT Dashboard

Supervisors and operations leads access a real-time dashboard showing:

- Active claim volume by event and geography
- Geographic distribution of claims by state and county
- Estimated aggregate exposure by coverage type
- Adjuster deployment status and remaining capacity

### Automated Triage

The agent classifies each CAT claim on intake by severity:

| Severity Track | Classification Criteria | Routing |
|---------------|------------------------|---------|
| Total Loss | Property described as destroyed or structurally uninhabitable | Senior adjuster fast track with pre-approved temporary housing vendor |
| Major Damage | Significant structural or system damage requiring contractor assessment | Field adjuster assignment within expedited SLA |
| Minor Damage | Cosmetic or limited damage with estimated repair cost below threshold | Virtual or desk adjuster with self-service repair vendor list |

### Policyholder Proactive Outreach

A Power Automate flow identifies policyholders with active property policies in the declared affected geography and sends proactive check-in messages through the configured agent channel.

## Deployment Channels

1. Internal claims handler and supervisor channel: Microsoft Teams (Azure AD internal identity).
2. External policyholder channel: Azure AD B2C authenticated web portal and SMS bridge.

## Core Integrations

- Claims management system API (Guidewire ClaimCenter or Duck Creek) for claim record creation and adjuster assignment
- Dataverse for CAT event state, claim aggregates, triage results, and outreach tracking
- Power Automate for bulk FNOL processing, triage scoring, outreach dispatch, and dashboard aggregation
- Pre-approved vendor directory (Dataverse or SharePoint list)
- Microsoft Teams for internal notifications and adjuster deployment coordination

## Repository Structure

```text
cat-event-processor/
├── README.md
├── runbook.md
├── CHANGELOG.md
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```

## Quick Start

1. Complete environment and integration prerequisites in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Dataverse solution.
3. Configure environment variables for the claims API, affected-geography data source, and outreach connector.
4. Load the pre-approved vendor list into the `CatVendorDirectory` Dataverse table.
5. Validate CAT declaration, bulk FNOL, triage, dashboard, and outreach scenarios.
6. Publish to the internal Teams channel for handlers and supervisors.
7. Ensure the external policyholder portal agent is linked for inbound CAT FNOL and outreach replies.
