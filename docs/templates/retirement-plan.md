# Agent Retirement Plan

Complete this plan during Phase 8 (Retirement) before executing any removal steps. Store the completed document alongside the agent's runbook.md and link it from the vertical README.md.

## 1. Agent Identity

| Field | Value |
| --- | --- |
| Agent Name | |
| Vertical | |
| Current Solution Version | |
| Agent Owner | |
| Business Owner | |
| Compliance Owner | |
| Retirement Requested By | |
| Date Plan Completed | |

---

## 2. Reason for Retirement

Check all that apply and provide a brief explanation.

- [ ] Business process it supports has been eliminated
- [ ] Replaced by a new agent with broader capabilities
- [ ] User adoption has dropped to near-zero despite promotion efforts
- [ ] Security or compliance issue that cannot be remediated
- [ ] Other

**Explanation:**

> (fill in)

---

## 3. Timeline

| Milestone | Target Date | Completed Date |
| --- | --- | --- |
| Retirement plan approved | | |
| Initial deprecation notice issued to users (30 days before) | | |
| 14-day reminder notice sent | | |
| 3-day reminder notice sent | | |
| Replacement agent/alternative confirmed ready | | |
| Agent unpublished from all channels | | |
| Power Automate flows deactivated | | |
| Solution archived in source control | | |
| Data retention period ends (delete authorized) | | |
| Dataverse tables deleted | | |
| Solution removed from production environment | | |
| Documentation updated (README.md marked retired) | | |

---

## 4. User Migration Plan

### Replacement or Alternative

| Task Previously Handled by Retiring Agent | Replacement Agent / Alternative | Channel / URL |
| --- | --- | --- |
| | | |
| | | |
| | | |

### Communication Plan

| Communication | Audience | Channel | Sent Date |
| --- | --- | --- | --- |
| Initial deprecation notice (30 days out) | All current users | Teams / Email | |
| 14-day reminder | All current users | Teams / Email | |
| 3-day reminder | All current users | Teams / Email | |
| Retirement confirmation | All current users | Teams / Email | |

**Communication template (initial notice):**

> Subject: [Agent Name] will be retired on [Retirement Date]
>
> [Agent Name] will no longer be available after [Retirement Date].
>
> To accomplish [primary user task], please use [Replacement Agent / Alternative] at [channel/URL].
>
> If you have questions, contact [Support Contact].

---

## 5. Data Retention and Compliance

| Item | Details | Confirmed |
| --- | --- | --- |
| Conversation transcript retention period | | Yes / No |
| Dataverse table retention period | | Yes / No |
| SharePoint knowledge source retention | Retain / Delete / Transfer to replacement | Yes / No |
| Analytics export archived | File location: | Yes / No |
| Compliance Owner reviewed retention plan | | Yes / No |

**Data deletion authorization:**

Compliance Owner confirms data may be deleted after the retention period.

Compliance Owner: _____________________________ Date: ___________

---

## 6. Technical Cleanup Checklist

### Channels
- [ ] Teams channel unpublished
- [ ] Web chat embed removed from hosting page(s)
- [ ] Any other active channels unpublished: ___________

### Flows and Connectors
- [ ] All Power Automate flows associated with this agent are deactivated
- [ ] Connection references removed or reassigned if shared with other solutions
- [ ] List of deactivated flows:
  - 
  - 

### Source Control
- [ ] Final solution exported and committed to source control
- [ ] Retirement tag applied in source control: `retired/v_____`
- [ ] Feature or operational branches archived or deleted

### Dataverse
- [ ] List of Dataverse tables owned by this agent:
  - 
  - 
- [ ] Retention period confirmed for each table
- [ ] Tables deleted after retention period elapses

### Cross-Agent References
- [ ] Agent removed from swarm orchestration configuration (if applicable)
- [ ] Agent removed from any cross-agent routing or handoff definitions
- [ ] References in other agents' runbooks updated

### Documentation
- [ ] Vertical README.md updated: agent listed as retired with retirement date
- [ ] Agent runbook.md annotated with retirement date and reason
- [ ] This retirement plan linked from the vertical README.md

---

## 7. Sign-off

By signing below, each stakeholder confirms the retirement plan has been reviewed and approved, and all applicable steps have been completed.

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Agent Owner | | | |
| Business Owner | | | |
| IT Admin | | | |
| Compliance Owner | | | |
