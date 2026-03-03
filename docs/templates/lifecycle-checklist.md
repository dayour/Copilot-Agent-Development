# Agent Lifecycle Checklist

Use this checklist to track a single agent through all eight lifecycle phases. Complete one copy per agent and store it alongside the agent's runbook.md.

## Agent Identity

| Field | Value |
| --- | --- |
| Agent Name | |
| Vertical | |
| Agent Owner | |
| Business Owner | |
| IT Admin | |
| Content Owner | |
| Target Environment | |
| Solution Version | |
| Checklist Last Updated | |

---

## Phase 1: Inception

### Requirements and Architecture
- [ ] `docs/templates/requirements-template.md` completed and reviewed
- [ ] Architecture decision recorded: single agent / multi-agent swarm (circle one)
- [ ] Architecture scoring table completed in requirements template
- [ ] All required connectors identified and availability confirmed
- [ ] Licensing requirements confirmed (Copilot Studio seats, premium connectors)
- [ ] Dataverse capacity confirmed

### Stakeholder Sign-off
- [ ] Business Owner has approved problem statement and success criteria
- [ ] IT Admin has confirmed environment availability and licensing
- [ ] Security has reviewed data classification and DLP requirements
- [ ] Compliance has confirmed data retention and residency requirements
- [ ] Content Owner identified for knowledge source maintenance

**Inception sign-off:** _____________________________ Date: ___________

---

## Phase 2: Development

### Scaffold and Branch
- [ ] Feature branch created: `feature/<vertical>-<agent-name>`
- [ ] Four-file scaffold created: README.md, runbook.md, templates/agent-template.yaml, solution/solution-definition.yaml
- [ ] Development environment provisioned (publisher, environment variables skeleton, connection references)

### Implementation
- [ ] Core topics implemented (minimum 5, covering 80% of user needs)
- [ ] Each topic has minimum 4 trigger phrases
- [ ] Greeting, Escalation/Fallback, and domain-specific topics present
- [ ] Power Automate flows use connection references (not embedded connections)
- [ ] Error handling implemented in all flows (try/catch scope, fallback response, error logging)
- [ ] Knowledge sources connected and content quality reviewed

### PR Review
- [ ] YAML syntax validated (agent-template.yaml and solution-definition.yaml)
- [ ] All four scaffold files present and complete
- [ ] Peer review approved by a second engineer
- [ ] Branch merged to main

**Development sign-off:** _____________________________ Date: ___________

---

## Phase 3: Testing

### Eval Test Set
- [ ] `tests/eval-test-set.md` created with Critical, Functional, and Integration tiers
- [ ] Minimum 10 Critical cases per topic
- [ ] Minimum 5 Functional cases per topic
- [ ] Minimum 3 Integration cases per external integration

### Ground Truth Evaluation
- [ ] All Critical eval cases executed against test environment
- [ ] All Critical eval cases pass (100% threshold)
- [ ] Functional eval cases executed: _____ / _____ pass (90%+ threshold)
- [ ] All failures triaged and resolved or accepted

### Manual QA
- [ ] Fallback topic triggered correctly for out-of-scope inputs
- [ ] Entity extraction verified for all slot-filling topics
- [ ] Error paths tested (flow failures, knowledge source misses, auth failures)
- [ ] Multi-turn and context retention scenarios verified

### UAT
- [ ] 3-5 business users recruited per vertical
- [ ] UAT sessions completed
- [ ] Resolution rate: _____ % (target: > 80%)
- [ ] Escalation rate: _____ % (target: < 20%)
- [ ] User satisfaction: _____ / 5.0 (target: > 4.0)
- [ ] UAT feedback reviewed; critical issues resolved

### Performance Baseline
- [ ] Baseline KPIs recorded in runbook.md (resolution rate, escalation rate, avg conversation length)

**Testing sign-off:** _____________________________ Date: ___________

---

## Phase 4: Staging

### Solution Export
- [ ] Managed solution exported from development environment
- [ ] Solution zip committed to source control under version tag

### Staging Import
- [ ] Solution imported to staging/UAT environment
- [ ] Environment variables mapped to staging values
- [ ] All components show Healthy after import
- [ ] Full test suite re-run against staging environment

### Stakeholder Acceptance
- [ ] Critical user flows demonstrated to Business Owner and stakeholders
- [ ] Written sign-off obtained from Business Owner

### Security and DLP
- [ ] DLP policies applied and enforced in staging environment
- [ ] Audit logging verified
- [ ] Authentication and authorization reviewed
- [ ] No sensitive data exposed in transcripts or flow outputs confirmed

**Staging sign-off:** _____________________________ Date: ___________

---

## Phase 5: Production

### Deployment
- [ ] Managed solution imported to production environment
- [ ] Environment variables mapped to production values
- [ ] All Power Automate flows activated and tested with production connections
- [ ] Knowledge sources connected and synced

### Channels
- [ ] Teams channel published and tested
- [ ] Web chat embed deployed and tested
- [ ] Channel-specific authentication (Teams SSO, web chat token endpoint) verified

### Monitoring
- [ ] Copilot Studio Analytics dashboard configured
- [ ] KPI widgets populated within 24 hours of go-live
- [ ] Alerting flows active (flow failure, resolution rate drop, unrecognized input spike)

### Rollback
- [ ] Rollback plan documented in runbook.md
- [ ] Previous solution version available in source control
- [ ] Rollback tested in staging

### Communication
- [ ] User announcement sent (what it does, how to access, example questions, support contact)
- [ ] Support channel established
- [ ] 1-week and 1-month follow-up communications scheduled

**Production sign-off:** _____________________________ Date: ___________

---

## Phase 6: Operations (Ongoing)

Track the cadence of operational reviews. Log the date completed for each occurrence.

### Weekly: Unrecognized Input Review
| Review Date | Unrecognized Input Rate | Actions Taken |
| --- | --- | --- |
| | | |
| | | |

### Monthly: Knowledge Source Refresh
| Refresh Date | Sources Updated | Issues Found |
| --- | --- | --- |
| | | |
| | | |

### Quarterly: Regression Evaluation
| Eval Date | Critical Cases Passed | Functional Cases Passed | KPI vs Baseline | Actions Taken |
| --- | --- | --- | --- | --- |
| | | | | |
| | | | | |

### Incident Log
| Date | Severity | Description | Resolution | Post-mortem Completed |
| --- | --- | --- | --- | --- |
| | | | | |

---

## Phase 7: Updates

For each update cycle, record the version, type, and gates completed.

| Version | Update Type | Regression Tests Passed | Rollback Plan Documented | Communication Sent | Deployed Date |
| --- | --- | --- | --- | --- | --- |
| | | | | | |
| | | | | | |

---

## Phase 8: Retirement

- [ ] `docs/templates/retirement-plan.md` completed
- [ ] Deprecation notice issued to users (date: ___________)
- [ ] Reminder notices sent at 14 days and 3 days before retirement
- [ ] Replacement agent or alternative identified and communicated
- [ ] All users confirmed onboarded to replacement
- [ ] Agent unpublished from all channels (date: ___________)
- [ ] Final conversation analytics and transcripts archived
- [ ] All Power Automate flows deactivated
- [ ] Solution archived in source control with retirement tag
- [ ] Dataverse data retention period confirmed with Compliance Owner
- [ ] Dataverse data deleted after retention period (date: ___________)
- [ ] Vertical README.md updated: agent marked as retired with retirement date
- [ ] Agent removed from any cross-agent orchestration or swarm configuration

**Retirement sign-off:** _____________________________ Date: ___________
