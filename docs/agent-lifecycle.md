# Agent Lifecycle Management

## Overview
This guide covers the complete lifecycle of a Copilot Studio agent from inception through production operation, updates, and eventual retirement. It applies uniformly across all verticals in this repository: coffee, clothing, insurance, tech, and transportation.

## Lifecycle Phases

```
Inception > Development > Testing > Staging > Production > Operations > Updates > Retirement
```

Use the templates in `docs/templates/` to track each agent through its lifecycle:
- `lifecycle-checklist.md`: per-agent phase gate tracking
- `requirements-template.md`: Inception phase requirements capture
- `retirement-plan.md`: Retirement phase planning and execution

## Phase 1: Inception

### Requirements Gathering
- Complete `docs/templates/requirements-template.md` for the new agent before any development begins.
- Define the business problem, target user personas, success criteria, and out-of-scope boundaries.
- Identify all external systems the agent must integrate with and confirm API/connector availability.
- Estimate conversation volume and peak load to inform licensing and capacity planning.

### Architecture Decision: Single vs Multi-Agent
Score the following criteria to determine whether a single agent or a multi-agent swarm is appropriate:

| Criterion | Single Agent | Multi-Agent |
| --- | --- | --- |
| Domain breadth | One focused domain | Multiple distinct domains |
| Topic count | Fewer than 15 topics | 15 or more topics |
| Team ownership | Single team owns all topics | Multiple teams own separate domains |
| Orchestration complexity | Linear flows | Cross-agent handoffs required |
| Independent deployability | Not required | Each agent must deploy independently |

If 3 or more criteria favor multi-agent, proceed with a swarm architecture (see `docs/swarm-architecture.md`). Note that team ownership and orchestration complexity carry the most architectural weight: if either of these two criteria strongly favors multi-agent, treat that as a deciding signal regardless of the total score.

### Stakeholder Sign-off Checklist
- [ ] Business Owner has approved the problem statement and success criteria
- [ ] IT Admin has confirmed environment availability and licensing
- [ ] Security has reviewed data classification and DLP requirements
- [ ] Compliance has confirmed data retention and residency requirements
- [ ] Content Owner has been identified for knowledge source maintenance

### Resource and License Requirements
- Identify the target Power Platform environment (dev, staging, production).
- Confirm Microsoft Copilot Studio license allocation (per-agent or per-session billing).
- Identify required connectors and confirm premium connector licensing if needed.
- Confirm Dataverse capacity for any new tables or storage requirements.
- Record all requirements in the completed `requirements-template.md` before proceeding.

## Phase 2: Development

### Scaffold Creation
- Branch strategy: `feature/<vertical>-<agent-name>` (e.g., `feature/coffee-order-assistant`).
- Use this repository's standard 4-file scaffold:
  - README.md: agent identity, topics, users, channels
  - runbook.md: prerequisites, deployment steps, validation, operations
  - templates/agent-template.yaml: topic definitions, trigger phrases, entities, actions
  - solution/solution-definition.yaml: environment variables, components, connectors, channels
- PR review requirements before merging: YAML syntax validation, doc completeness check (all 4 files present), peer review by a second engineer.
- Provision the development environment before coding begins: confirm solution publisher, environment variables skeleton, and connection references are in place.

### Topic Design Principles
- Start with 5-8 core topics that cover 80% of user needs
- Each topic should have a clear, single responsibility
- Trigger phrases: minimum 5 per topic, covering natural language variations
- Always include: Greeting, Escalation/Fallback, and at least 3 domain-specific topics
- Design for the novice user: assume they do not know what the agent can do

### Knowledge Source Preparation
- Audit existing content: identify what exists, what gaps need filling
- Structure content for agent consumption: short paragraphs, clear headings, atomic Q&A pairs
- Content quality gate: review all knowledge source content before connecting to agent
- Content ownership: assign a business owner for each knowledge source

### Power Automate Flow Development
- One flow per external system interaction
- Use connection references (not embedded connections) for ALM portability
- Implement error handling in every flow: try/catch scope, fallback response, error logging
- Test flows independently before connecting to agent topics

### Local Testing (Author Testing)
- Use Copilot Studio Test Canvas: the built-in test pane for topic-by-topic testing
- Test each topic individually with multiple trigger phrase variations
- Test entity extraction: does the agent correctly capture user input?
- Test flow integration: do Power Automate flows return expected results?
- Test error paths: what happens when a flow fails or returns unexpected data?

## Phase 3: Testing

### Eval Test Set Creation
Create a three-tier test set before testing begins:

| Tier | Description | Minimum Cases |
| --- | --- | --- |
| Critical | Core happy-path flows that must work for the agent to deliver value | 10 per topic |
| Functional | Edge cases, missing entities, ambiguous inputs, multi-turn flows | 5 per topic |
| Integration | End-to-end flows exercising real connectors, flows, and knowledge sources | 3 per integration |

Store test sets in the agent's repository folder under `tests/eval-test-set.md`.

### Ground Truth Evaluation
- Run all Critical and Functional test cases against the test environment before UAT begins.
- Record expected vs actual response for each case.
- Acceptance threshold: 100% of Critical cases pass; 90%+ of Functional cases pass.
- Document all failures and triage before advancing to UAT.

### User Acceptance Testing (UAT)
- Recruit 3-5 business users per vertical (actual baristas for Coffee, actual sales reps for Tech, etc.)
- Provide test scenarios but also allow freeform exploration.
- Collect feedback: accuracy, helpfulness, naturalness, missing capabilities.
- Track: resolution rate, escalation rate, user satisfaction (1-5 scale).
- UAT exit criteria: 80%+ resolution rate, less than 20% escalation rate, 4.0+ satisfaction.

### Manual QA Validation Checklist
- [ ] All Critical eval test cases pass
- [ ] All Functional eval test cases pass at or above threshold
- [ ] UAT feedback reviewed and critical issues resolved
- [ ] Fallback topic triggered correctly for all out-of-scope inputs
- [ ] Entity extraction verified for all slot-filling topics
- [ ] Error paths tested: flow failures, knowledge source misses, auth failures

### Performance Baseline
- Record baseline KPIs from the test environment: resolution rate, escalation rate, average conversation length.
- Store baselines in the agent runbook as the reference for post-launch monitoring.

### Conversation Testing
- Copilot Studio provides a built-in conversation testing framework.
- Create test conversations: scripted user inputs with expected agent responses.
- Test scenarios:
  - Happy path: standard user flow for each topic
  - Edge cases: missing entities, ambiguous input, out-of-scope questions
  - Multi-turn: conversations that span multiple topics
  - Context retention: verify context variables persist correctly across turns
  - Fallback: verify unrecognized input triggers fallback topic gracefully

### Integration Testing
- Verify all Power Automate flows work with real (test environment) data.
- Verify authentication flows work for each channel.
- Verify knowledge sources return relevant content.
- Verify Dataverse tables are populated correctly by flows.
- Verify cross-system data consistency (e.g., Salesforce lead created matches agent input).

## Phase 4: Staging

### Solution Export from Development
- Export the solution from the development environment as a managed solution using Power Platform CLI: `pac solution export --name <SolutionName> --path ./export --managed`.
- Commit the exported solution zip to source control under a version tag.

### Import to Staging/UAT Environment
- Import into the staging (pre-production) environment.
- Map environment variables to staging values.
- Verify all components show Healthy after import.
- Run the full test suite against the staging environment.

### Stakeholder Acceptance Testing
- Present the staged agent to the Business Owner and key stakeholders.
- Demonstrate all critical user flows using the Critical eval test cases.
- Obtain written sign-off from the Business Owner before proceeding to production.

### Security Review and DLP Compliance
- Validate with production-like data volumes.
- Test under concurrent user load (if applicable).
- Verify DLP policies are applied and enforced.
- Verify audit logging is capturing events.
- Security review: authentication, authorization, data access scope.
- Confirm no sensitive data is exposed in conversation transcripts or flow outputs.

## Phase 5: Production

### Production Deployment via Managed Solution
Import the managed solution into the production environment using Power Platform CLI: `pac solution import --path ./export/<SolutionName>_managed.zip`. Map all environment variables to production values immediately after import. Verify all solution components show Healthy before proceeding to channel enablement.

### Channel Enablement
- Channels enabled: Teams published, web chat embed deployed.
- Confirm channel-specific authentication (Teams SSO, web chat token endpoint) is functioning.
- Verify mobile accessibility if applicable.

### Monitoring Dashboard Activation
- Configure Copilot Studio Analytics dashboard for the production environment.
- Set up Power BI report connected to Dataverse audit and conversation tables if required.
- Confirm all KPI widgets are populating correctly within 24 hours of go-live.

### Go-Live Checklist
- [ ] Solution imported as managed solution in production environment
- [ ] Environment variables mapped to production values
- [ ] All Power Automate flows activated and tested with production connections
- [ ] Knowledge sources connected and synced
- [ ] Authentication configured and tested for all channels
- [ ] Channels enabled and verified
- [ ] DLP policies applied
- [ ] Monitoring dashboards active and populated
- [ ] Rollback plan documented and tested
- [ ] User communication sent (announcement, training materials, FAQ)
- [ ] Support channel established (who do users contact for agent issues?)

### Communication Plan Execution
- Announce via Teams/email to target user group.
- Include: what the agent does, how to access it, example questions to try, who to contact for issues.
- Schedule follow-up communication at 1 week and 1 month post-launch.

## Phase 6: Operations

### Weekly: Unrecognized Input Review
- Export the unrecognized inputs report from Copilot Studio Analytics.
- Triage inputs: categorize as new topic candidates, trigger phrase gaps, or noise.
- Add trigger phrases or create new topics for any recurrent unrecognized pattern.
- Target: reduce unrecognized input rate below 15% and keep it there.

### Monthly: Knowledge Source Refresh
- Audit all connected knowledge sources for stale or outdated content.
- Coordinate with Content Owner to update or remove outdated documents.
- Trigger a knowledge source sync after updates and verify new content surfaces correctly.
- Log the refresh date and any changes in the agent runbook.

### Quarterly: Regression Evaluation
- Re-run the full eval test set (Critical, Functional, Integration tiers) against production.
- Compare results to the performance baseline established in Phase 3.
- If any Critical test cases fail, raise an incident immediately.
- Review and refresh the test set to add cases covering new user patterns observed since launch.

### Incident Response Procedures
- **Severity 1 (agent fully down)**: IT Admin notified within 15 minutes; rollback initiated if resolution > 30 minutes.
- **Severity 2 (major topic failure)**: Agent Owner notified within 1 hour; hotfix deployed within 4 hours.
- **Severity 3 (degraded accuracy)**: Tracked in backlog; addressed in next update cycle.
- Incident post-mortem required for all Severity 1 and Severity 2 incidents; findings fed back into test set and monitoring alerts.

### Key Performance Indicators (KPIs)
| KPI | Target | Measurement Source |
| --- | --- | --- |
| Resolution Rate | > 80% | Copilot Studio Analytics |
| Escalation Rate | < 20% | Copilot Studio Analytics |
| User Satisfaction (CSAT) | > 4.0 / 5.0 | Post-conversation survey |
| Conversation Volume | Trending up | Copilot Studio Analytics |
| Flow Success Rate | > 99% | Power Automate run history |
| Knowledge Source Freshness | < 7 days stale | Manual audit |
| Unrecognized Input Rate | < 15% | Copilot Studio Analytics |

### Alerting
- Flow failure > 3 consecutive: alert IT Admin.
- Resolution rate drops below 70%: alert Agent Owner.
- Unrecognized input rate spikes above 25%: alert Copilot Studio Admin.
- Implement via Power Automate scheduled flows writing to monitoring table and Teams notification.

## Phase 7: Updates

### Version Management: Patches vs Upgrades
- **Patch** (x.y.Z): trigger phrase, message text, or knowledge content only. No solution re-export required.
- **Minor upgrade** (x.Y.0): new topics, flow logic changes, or new knowledge sources. Full dev > test > stage > prod cycle.
- **Major upgrade** (X.0.0): new connectors, schema changes, architectural redesign. Full lifecycle with security review.

### Regression Testing Before Promotion
- Re-run the Critical eval test set before promoting any minor or major upgrade to production.
- For major upgrades, re-run the full eval test set (all tiers).
- A failing Critical test case blocks promotion until resolved.

### Rollback Procedures
- Maintain the previous managed solution zip in source control under a version tag.
- To rollback: import the previous version as a managed solution with the upgrade option.
- Verify rollback in staging before applying to production.
- Document the rollback in the agent runbook with the reason and date.

### Change Communication
- Notify users of significant changes (new capabilities, removed topics, channel changes) at least 3 business days in advance.
- Update the agent README.md with the new version and a changelog entry.
- Tag the release in source control aligned with the solution version number.

## Phase 8: Retirement

### Deprecation Notice Period
- Issue a deprecation notice to all users at least 30 days before the retirement date.
- Include the retirement date, the reason, and what users should do instead.
- Send reminder notices at 14 days and 3 days before retirement.

### User Migration to Replacement Agent
- Identify the replacement agent or alternative process for each user task the retiring agent handled.
- Update the retiring agent's greeting topic to direct users to the replacement immediately after notice is issued.
- Confirm all users have been onboarded to the replacement before executing retirement.

### Data Retention Compliance
- Identify all Dataverse tables and SharePoint data associated with the agent.
- Confirm the applicable data retention period with the Compliance Owner.
- Do not delete Dataverse data until the retention period has elapsed.
- Archive conversation transcripts and analytics exports per the retention policy.

### Solution Removal and Cleanup
Complete `docs/templates/retirement-plan.md` for the agent before beginning removal steps.

1. Announce retirement date to users (minimum 30 days notice already issued).
2. On retirement date: unpublish from all channels.
3. Export final conversation analytics and transcripts for archival.
4. Deactivate all Power Automate flows associated with the agent.
5. Archive the solution in source control with a retirement tag (e.g., `retired/v1.2.0`).
6. Retain Dataverse data per retention policy (do not delete immediately).
7. After retention period elapses: delete Dataverse tables, remove solution from environment.
8. Update the vertical README.md: mark agent as retired with the retirement date.
9. Remove the agent entry from any cross-agent orchestration or swarm configuration files.

## Solution Layering and ALM

### Solution Architecture
- Base solution: the scaffold from this repository (unmanaged during development)
- Managed solution: exported for deployment to staging/production
- Patches: incremental updates without re-exporting the full solution
- Solution layering: when multiple solutions contribute to the same environment, manage component ownership carefully

### Source Control Integration
- Store solution definition files in Git (this repository)
- Use feature branches for development
- Pull request review for changes before merging to main
- CI/CD pipeline: Power Platform Build Tools for Azure DevOps or GitHub Actions for Power Platform

### CI/CD Pipeline (Advanced)
- Trigger: merge to main branch
- Steps:
  1. Export solution from dev environment (Power Platform CLI: pac solution export)
  2. Unpack solution (pac solution unpack)
  3. Commit unpacked files to source control
  4. Import to staging (pac solution import)
  5. Run automated tests
  6. Manual approval gate
  7. Import to production
- Tools: Power Platform CLI, Power Platform Build Tools, GitHub Actions

## Operational Reference

### Phase Exit Checklist
Use `docs/templates/lifecycle-checklist.md` to track each agent through the full lifecycle. The table below summarizes exit criteria per phase.

| Phase | Exit Criteria | Owner | Sign-off Required |
| --- | --- | --- | --- |
| Inception | Requirements captured, architecture decision made, stakeholder sign-off obtained | Agent Owner | Business Owner + IT Admin |
| Development | Core topics implemented, flows unit-tested, content quality reviewed | Copilot Studio Admin | Agent Owner |
| Testing | All Critical eval cases pass, UAT criteria met, integration tests pass, defects triaged | QA Lead | Business Owner |
| Staging | Managed solution imported, stakeholder acceptance obtained, DLP and security review complete | IT Admin | Security + Agent Owner |
| Production | Go-live checklist complete, channels active, monitoring live, rollback validated | Release Manager | Product Sponsor |
| Operations | Ongoing: weekly/monthly/quarterly reviews on schedule, KPIs within targets | Operations | Agent Owner |
| Updates | Change plan executed with version bump and regression tests passed | Release Manager | Agent Owner |
| Retirement | Retirement plan complete, users migrated, archives stored, data retained per policy | Operations | Compliance Owner |

### Risk Classification Matrix
| Change Type | Risk Level | Required Environment Path | Approval |
| --- | --- | --- | --- |
| Trigger phrase or message text edit | Low | Dev > Prod | Agent Owner |
| Knowledge content refresh | Low | Content review > Prod sync | Content Owner |
| Flow logic change | Medium | Dev > Test > Stage > Prod | IT Admin + Agent Owner |
| New connector or auth scope change | High | Full lifecycle with security review | Security + CAB |
| Dataverse schema or major topic redesign | High | Full lifecycle with rollback drill | CAB |

### Minimum Artifact Set per Release
1. Updated solution version (major.minor.patch)
2. Release notes with changed topics/flows/knowledge sources
3. Test evidence (conversation tests, UAT summary, integration run results)
4. Rollback instructions with prior version reference
5. Communication plan and support routing notes

### Documentation Governance
- Review this guide quarterly or after major incidents
- Keep owner list current in README.md and runbook.md
- Link release notes to corresponding Git tags
- Archive superseded operational procedures instead of deleting them
