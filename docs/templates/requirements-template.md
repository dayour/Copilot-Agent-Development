# Agent Requirements Template

Complete this template during the Inception phase (Phase 1) before any development begins. Store the completed document alongside the agent's runbook.md. This template is standardized across all verticals.

## 1. Agent Identity

| Field | Value |
| --- | --- |
| Proposed Agent Name | |
| Vertical | coffee / clothing / insurance / tech / transportation |
| Requesting Team | |
| Business Owner | |
| Agent Owner (technical lead) | |
| Date Completed | |

---

## 2. Problem Statement

### Business Problem
Describe the business problem this agent will solve in 2-4 sentences. Be specific about pain points, inefficiencies, or user needs.

> (fill in)

### Current State
How is this problem being handled today (manual process, existing tool, not handled)?

> (fill in)

### Desired Future State
What will change for users once the agent is live?

> (fill in)

---

## 3. Target Users

### Primary User Personas
List the primary users who will interact with this agent.

| Persona | Role | Goal | Technical Comfort |
| --- | --- | --- | --- |
| | | | Low / Medium / High |
| | | | Low / Medium / High |
| | | | Low / Medium / High |

### Estimated User Volume
| Metric | Estimate |
| --- | --- |
| Unique users per month | |
| Conversations per day (average) | |
| Peak concurrent conversations | |

---

## 4. Scope

### In Scope
List the specific user tasks or questions this agent will handle.

1. 
2. 
3. 
4. 
5. 

### Out of Scope
List tasks this agent will explicitly NOT handle and why.

1. 
2. 
3. 

### Success Criteria
Define measurable outcomes that indicate the agent is delivering value.

| Metric | Target | Measurement Method |
| --- | --- | --- |
| Resolution Rate | > 80% | Copilot Studio Analytics |
| Escalation Rate | < 20% | Copilot Studio Analytics |
| User Satisfaction (CSAT) | > 4.0 / 5.0 | Post-conversation survey |
| | | |
| | | |

---

## 5. Architecture Decision

Complete the scoring table to determine single agent vs multi-agent swarm.

| Criterion | Score: Single (1) or Multi (2) | Notes |
| --- | --- | --- |
| Domain breadth: one focused domain (1) vs multiple distinct domains (2) | | |
| Topic count: fewer than 15 topics (1) vs 15 or more (2) | | |
| Team ownership: single team (1) vs multiple teams (2) | | |
| Orchestration complexity: linear flows (1) vs cross-agent handoffs required (2) | | |
| Independent deployability: not required (1) vs required (2) | | |
| **Total score** | | |

**Decision:** Single Agent / Multi-Agent Swarm (circle one)

If multi-agent: reference `docs/swarm-architecture.md` for orchestration design guidance.

If single agent: confirm the agent will stay below 15 topics at launch.

---

## 6. External Integrations

List all external systems this agent must integrate with.

| System | Integration Method | Data Accessed | Auth Method | Connector Available |
| --- | --- | --- | --- | --- |
| | Power Automate / Direct / API | | Azure AD / API Key / None | Yes / No |
| | Power Automate / Direct / API | | Azure AD / API Key / None | Yes / No |
| | Power Automate / Direct / API | | Azure AD / API Key / None | Yes / No |

---

## 7. Knowledge Sources

List the knowledge sources this agent will use for generative answers.

| Source Name | Type | Owner | Update Frequency | Current Quality |
| --- | --- | --- | --- | --- |
| | SharePoint / Website / Upload | | Daily / Weekly / Monthly | Good / Needs work |
| | SharePoint / Website / Upload | | Daily / Weekly / Monthly | Good / Needs work |

---

## 8. Resource and License Requirements

| Requirement | Details | Confirmed |
| --- | --- | --- |
| Copilot Studio license type | Per-agent / Per-session | Yes / No |
| Copilot Studio seat count | | Yes / No |
| Premium connector licenses required | List connectors: | Yes / No / N/A |
| Dataverse capacity (additional tables) | List tables: | Yes / No |
| Target development environment | | Yes / No |
| Target staging environment | | Yes / No |
| Target production environment | | Yes / No |

---

## 9. Data Classification and Compliance

| Question | Answer |
| --- | --- |
| Does the agent handle personally identifiable information (PII)? | Yes / No |
| Does the agent handle sensitive business data? | Yes / No |
| Data residency requirement (region) | |
| Applicable compliance frameworks | GDPR / HIPAA / SOC 2 / None / Other: |
| Data retention period for conversation transcripts | |
| DLP policy to apply | |

---

## 10. Risks and Dependencies

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| | Low / Med / High | Low / Med / High | |
| | Low / Med / High | Low / Med / High | |

### Dependencies
List anything that must be in place before development can begin.

1. 
2. 
3. 

---

## 11. Stakeholder Sign-off

By signing below, each stakeholder confirms they have reviewed this requirements document and approve proceeding to the Development phase.

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Business Owner | | | |
| IT Admin | | | |
| Security | | | |
| Compliance | | | |
| Agent Owner | | | |
