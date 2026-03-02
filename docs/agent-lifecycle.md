# Agent Lifecycle Management

## Overview
This guide covers the complete lifecycle of a Copilot Studio agent from initial development through production operation, updates, and eventual retirement.

## Lifecycle Stages

```
Development > Testing > Staging > Production > Monitoring > Updates > Retirement
```

## Stage 1: Development

### Scaffold Creation
- Use this repository's standard 4-file scaffold:
  - README.md: agent identity, topics, users, channels
  - runbook.md: prerequisites, deployment steps, validation, operations
  - templates/agent-template.yaml: topic definitions, trigger phrases, entities, actions
  - solution/solution-definition.yaml: environment variables, components, connectors, channels

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

## Stage 2: Testing

### Conversation Testing
- Copilot Studio provides a built-in conversation testing framework
- Create test conversations: scripted user inputs with expected agent responses
- Test scenarios:
  - Happy path: standard user flow for each topic
  - Edge cases: missing entities, ambiguous input, out-of-scope questions
  - Multi-turn: conversations that span multiple topics
  - Context retention: verify context variables persist correctly across turns
  - Fallback: verify unrecognized input triggers fallback topic gracefully

### User Acceptance Testing (UAT)
- Recruit 3-5 business users per vertical (actual baristas for Coffee, actual sales reps for Tech, etc.)
- Provide test scenarios but also allow freeform exploration
- Collect feedback: accuracy, helpfulness, naturalness, missing capabilities
- Track: resolution rate, escalation rate, user satisfaction (1-5 scale)
- UAT exit criteria: 80%+ resolution rate, less than 20% escalation rate, 4.0+ satisfaction

### Integration Testing
- Verify all Power Automate flows work with real (test environment) data
- Verify authentication flows work for each channel
- Verify knowledge sources return relevant content
- Verify Dataverse tables are populated correctly by flows
- Verify cross-system data consistency (e.g., Salesforce lead created matches agent input)

## Stage 3: Staging

### Solution Promotion
- Export the solution from the development environment as a managed solution
- Import into the staging (pre-production) environment
- Map environment variables to staging values
- Verify all components show Healthy after import
- Run the full test suite against the staging environment

### Pre-Production Validation
- Validate with production-like data volumes
- Test under concurrent user load (if applicable)
- Verify DLP policies are applied and enforced
- Verify audit logging is capturing events
- Security review: authentication, authorization, data access scope

## Stage 4: Production

### Go-Live Checklist
- [ ] Solution imported as managed solution in production environment
- [ ] Environment variables mapped to production values
- [ ] All Power Automate flows activated and tested with production connections
- [ ] Knowledge sources connected and synced
- [ ] Authentication configured and tested for all channels
- [ ] Channels enabled: Teams published, web chat embed deployed
- [ ] DLP policies applied
- [ ] Monitoring dashboards configured
- [ ] Rollback plan documented and tested
- [ ] User communication sent (announcement, training materials, FAQ)
- [ ] Support channel established (who do users contact for agent issues?)

### Launch Communication
- Announce via Teams/email to target user group
- Include: what the agent does, how to access it, example questions to try, who to contact for issues
- Schedule follow-up communication at 1 week and 1 month post-launch

## Stage 5: Monitoring

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

### Monitoring Cadence
| Frequency | Activity | Owner |
| --- | --- | --- |
| Daily | Check flow failure alerts | IT Admin |
| Weekly | Review conversation analytics dashboard | Agent Owner |
| Bi-weekly | Review unrecognized inputs, add to topics | Copilot Studio Admin |
| Monthly | Knowledge source freshness audit | Content Owner |
| Quarterly | Full agent health review (KPIs, user feedback, roadmap) | Agent Owner + IT |

### Alerting
- Flow failure > 3 consecutive: alert IT Admin
- Resolution rate drops below 70%: alert Agent Owner
- Unrecognized input rate spikes above 25%: alert Copilot Studio Admin
- Implement via Power Automate scheduled flows writing to monitoring table + Teams notification

## Stage 6: Updates

### Topic Updates (Low Risk)
- Edit trigger phrases, messages, or conditions in Copilot Studio
- Click Publish -- changes are live immediately
- No solution re-import needed
- Test in test canvas before publishing

### Knowledge Source Updates (Low Risk)
- Update documents in SharePoint or upload new files
- Trigger a knowledge source refresh/sync
- Verify new content appears in agent responses

### Flow Updates (Medium Risk)
- Edit Power Automate flows in the development environment
- Test thoroughly with test data
- Export updated solution and import to production
- Verify flow connections are maintained after import

### Major Updates (High Risk)
- New topics, new integrations, schema changes
- Full development > testing > staging > production cycle
- Schedule maintenance window, notify users
- Have rollback plan ready

### Versioning
- Use Power Platform solution versioning: major.minor.patch (e.g., 1.2.0)
- Increment patch for topic/knowledge updates
- Increment minor for new topics or flow changes
- Increment major for architectural changes (new integrations, schema changes)
- Tag in source control (git tag) aligned with solution version

## Stage 7: Retirement

### When to Retire an Agent
- Business process it supports has been eliminated
- Replaced by a new agent with broader capabilities
- User adoption has dropped to near-zero despite promotion efforts

### Retirement Process
1. Announce retirement date to users (minimum 30 days notice)
2. Provide alternative: replacement agent, human contact, self-service portal
3. On retirement date: unpublish from all channels
4. Export final conversation analytics and transcripts for archival
5. Deactivate all Power Automate flows associated with the agent
6. Archive the solution in source control with a retirement tag
7. Retain Dataverse data per retention policy (do not delete immediately)
8. After retention period: delete Dataverse tables, remove solution from environment
9. Update documentation: mark agent as retired in repository README

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

## Operational Templates

### Stage Exit Checklist
| Stage | Exit Criteria | Owner | Sign-off Required |
| --- | --- | --- | --- |
| Development | Core topics implemented, flows unit-tested, content quality reviewed | Copilot Studio Admin | Agent Owner |
| Testing | UAT criteria met, integration tests pass, defects triaged | QA Lead | Business Owner |
| Staging | Managed solution imported, pre-production validation complete | IT Admin | Security + Agent Owner |
| Production | Go-live checklist complete and rollback validated | Release Manager | Product Sponsor |
| Monitoring | KPI dashboard and alerting active | Operations | Agent Owner |
| Updates | Change plan executed with version bump | Release Manager | Agent Owner |
| Retirement | Retirement steps complete and archives stored | Operations | Compliance Owner |

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
