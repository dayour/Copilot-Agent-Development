# Runbook — CAT Event Processor (Bulk Claims Processing)

## Overview

This runbook defines deployment, configuration, validation, and operations for the CAT Event Processor agent. The agent supports mass claims intake, automated triage, real-time dashboard visibility, and proactive policyholder outreach during declared catastrophe events.

## Prerequisites

### Platform and licensing

| Requirement | Details |
|-------------|---------|
| Copilot Studio license | Per-tenant or per-user licensing approved by platform governance |
| Power Platform environment | Production Dataverse environment in approved geography |
| Power Automate | Required for bulk FNOL processing, outreach dispatch, and dashboard aggregation |
| Microsoft 365 + Teams | Required for internal handler and supervisor deployment |
| Azure AD + Azure AD B2C | Internal workforce identity and external policyholder identity |

### Integration dependencies

| Integration | Requirement |
|------------|-------------|
| Claims management API | Guidewire ClaimCenter or Duck Creek API endpoint, OAuth2 client credentials, non-production and production base URLs |
| Dataverse environment | Tables for CatEvents, CatClaimRecords, CatTriageResults, AffectedPolicyholdersOutreach, CatVendorDirectory |
| Policy geography data | Policyholder address data accessible via API or Dataverse view for outreach targeting |
| Outreach connector | Office 365 Outlook and Teams connector for policyholder and handler notifications |

### Security and operations prerequisites

| Requirement | Details |
|-------------|---------|
| DLP policy | Connector grouping and exfiltration controls approved by security governance |
| Key management | Secrets in environment variables or secure connection references |
| Audit | Dataverse auditing enabled for CAT event and claim tables |
| Role-based access | CAT declaration and deactivation restricted to claims manager and supervisor roles |

---

## Deployment Steps

### 1. Provision environment

1. Open <https://copilotstudio.microsoft.com>.
2. Select the target production Dataverse environment.
3. Confirm data residency and retention requirements with compliance.

### 2. Import solution package

1. Go to **Solutions** and import `solution/solution-definition.yaml`.
2. Map environment variables for the claims API, outreach sender address, affected geography API, and vendor directory URL.
3. Validate connection references and credentials.
4. Confirm all solution components import with healthy status.

### 3. Configure claims integration

1. Configure the claims management connector (Guidewire or Duck Creek).
2. Verify the bulk FNOL endpoint accepts batch payloads and returns claim reference arrays.
3. Test adjuster assignment API with a sample CAT event profile.

### 4. Load CAT vendor directory

1. Populate Dataverse table `CatVendorDirectory` with pre-approved vendors for each service category:
   - Emergency board-up and tarping
   - Temporary housing placement
   - Water mitigation and drying
   - Structural assessment contractors
2. Tag each vendor with supported states and coverage types.
3. Validate vendor list retrieval in the agent topic `CAT Vendor and Resources`.

### 5. Configure geography and outreach targeting

1. Confirm the `AffectedGeographyApiBaseUrl` environment variable points to the FEMA disaster declaration feed or equivalent internal geography service.
2. Configure the `PolicyholderGeographyMatchFlow` to join policyholder address records against affected county or ZIP code lists.
3. Set `OutreachSenderAddress` to the approved outreach sender for compliance with CAN-SPAM and state insurance communication regulations.
4. Test outreach targeting with a sample affected geography set against a non-production policyholder dataset.

### 6. Configure CAT event state management

1. Verify Dataverse table `CatEvents` exists with required columns (EventName, EventType, AffectedStates, AffectedCounties, StartDateTime, EndDateTime, Status, ActivatedBy, ApprovedBy).
2. Configure the `DeclareCatEvent` flow to require supervisor approval before setting Status to Active.
3. Validate that `cat_mode_active` global variable in agent template is synchronized with the active event record in `CatEvents`.

### 7. Configure authentication and channels

1. Internal channel: configure Azure AD tenant restriction for Teams handlers and supervisors.
2. External channel (if enabled): configure Azure AD B2C for policyholder web portal access.
3. Validate that CAT declaration and deactivation topics are restricted to internal handler audience.

### 8. Publish

1. Publish to Teams for claims handlers, supervisors, and operations leads.
2. If external channel is enabled, publish to the policyholder web portal and link to the main Claims Assistant agent outreach flow.
3. Run post-publish smoke tests.

---

## Post-Deployment Validation Checklist

### CAT event declaration validation

- [ ] Claims manager can declare a CAT event with event name, type, affected states, and start time.
- [ ] Supervisor approval step is triggered before activation.
- [ ] CAT mode flag activates after approval and persists in Dataverse.
- [ ] Pre-approved vendor list is accessible once CAT mode is active.
- [ ] Handlers receive Teams notification on CAT mode activation.

### Bulk FNOL intake validation

- [ ] Agent switches to streamlined intake prompts when CAT mode is active.
- [ ] Minimum viable fields (policy number, loss location, loss description, contact info) are sufficient to complete intake.
- [ ] Batch FNOL flow creates claim records in the claims management system.
- [ ] Claim references are returned and communicated to the policyholder.

### Triage and dashboard validation

- [ ] Agent classifies at least one sample claim into each severity track (total loss, major damage, minor damage).
- [ ] Triage results are written to the `CatTriageResults` Dataverse table.
- [ ] CAT dashboard returns current claim volume, geographic distribution, aggregate exposure, and adjuster deployment.
- [ ] Dashboard data refreshes within one minute of new claim submissions.

### Proactive outreach validation

- [ ] Outreach flow correctly identifies policyholders with active property policies in the declared affected geography.
- [ ] Outreach messages are sent and logged in `AffectedPolicyholdersOutreach`.
- [ ] Duplicate outreach prevention logic prevents multiple messages per policyholder per event.
- [ ] Opt-out records are respected before dispatch.

### Security and privacy validation

- [ ] CAT declaration and deactivation topics are inaccessible to external (policyholder) users.
- [ ] PII fields in outreach targeting are not logged in conversation transcripts.
- [ ] Access to CAT event management topics is restricted to authorized handler and supervisor roles.

---

## Data Privacy and Records Management

| Control Area | Requirement |
|-------------|-------------|
| Outreach targeting | Policyholder address data used solely for event-specific outreach; not retained beyond event period |
| PII handling | Limit intake data to minimum necessary for CAT claim creation |
| Log retention | CAT event records and outreach logs retained per regulatory and corporate retention policy |
| Purpose limitation | Collected data used solely for claims handling and event-specific outreach |
| Access control | Enforce least privilege for handler, supervisor, and engineering roles |

---

## CAT Event Lifecycle

### Activation

1. Claims operations lead or manager invokes `CAT Event Declaration` topic in the Teams channel.
2. Provides event name, type, affected states and counties, start timestamp, and estimated intake surge.
3. `DeclareCatEvent` flow creates a pending event record and triggers supervisor approval.
4. On approval, event status is set to Active, CAT mode flag is enabled, and handlers are notified.

### Operations During Event

- Bulk FNOL intake operates in streamlined mode.
- Triage flow classifies and routes claims continuously.
- Dashboard is refreshed on a scheduled interval (default: every five minutes).
- Outreach flow runs once on activation and can be re-triggered for newly identified policyholders.

### Deactivation

1. Claims operations lead invokes `CAT Event Deactivation` topic.
2. Provides deactivation reason and end timestamp.
3. `DeactivateCatEvent` flow sets event status to Closed, disables CAT mode flag, and restores standard SLA controls.
4. Final event summary is generated and distributed to claims leadership.

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| CAT claim volume and triage review | Continuous during event | Claims Operations Manager |
| Dashboard aggregate accuracy check | Hourly during event | Claims Operations Manager |
| Outreach delivery and reply tracking | Daily during event | Customer Experience Lead |
| API and flow health checks | Continuous + hourly during event | Platform Engineering |
| Adjuster deployment capacity review | Every four hours during event | Claims Staffing Lead |
| Post-event summary report | On deactivation | Claims Leadership |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|---------------|------------|
| CAT declaration flow failure | Platform Engineering | Claims Operations Lead and Incident Commander |
| Bulk FNOL API outage | Platform Engineering | Vendor and Claims Leadership |
| Outreach delivery failure | Platform Engineering | Customer Experience Lead and DPO |
| Triage misclassification volume spike | Claims Operations Manager | Data Science and Claims Leadership |
| PII incident during outreach | DPO | CISO and Legal |

---

## Rollback Procedure

1. Invoke `CAT Event Deactivation` topic to restore standard intake and SLA controls.
2. If agent is unresponsive, set `CatEvents` record Status to Closed directly in Dataverse.
3. Unpublish current agent version if a full rollback is required.
4. Re-import previous signed solution artifact from release repository.
5. Rebind production connection references and environment variables.
6. Notify claims operations, compliance, and contact center leadership.
