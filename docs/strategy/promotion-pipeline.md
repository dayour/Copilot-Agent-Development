# Promotion Pipeline

## Overview
This document defines the end-to-end promotion process for moving Copilot Studio agents from development through to production across all verticals (Coffee, Clothing, Insurance, Tech, Transportation). It specifies triggers, process steps, quality gates, validation requirements, and rollback procedures for each promotion stage.

## Pipeline Summary

```
Dev --> Test/UAT --> Production
              |
              v (optional extended path)
         Integration --> Staging --> Production
```

Each arrow represents a managed solution export from the source environment followed by an import into the destination environment. No direct changes are permitted in Test/UAT or Production -- all changes originate in Dev.

## Stage 1: Dev to Test/UAT

### Trigger
A pull request is merged to the `main` branch in this repository that includes changes to an agent's `templates/agent-template.yaml`, `solution/solution-definition.yaml`, or associated `runbook.md`.

### Process
1. Agent builder exports the solution from the Dev environment as a **managed** solution using the Power Platform CLI.
   ```
   pac solution export --path ./export --name <SolutionName> --managed true
   ```
2. The exported solution file is committed to the `solution/` directory of the relevant agent in source control.
3. An IT admin or authorised pipeline imports the managed solution into the Test/UAT environment.
   ```
   pac solution import --path ./export/<SolutionName>_managed.zip --environment <test-env-id>
   ```
4. Environment variables in the Test/UAT environment are mapped to test/staging data sources (see `environment-variable-matrix.md`).
5. All Power Automate flow connections are re-established using the test environment service account.

### Quality Gate: Dev to Test/UAT
All of the following must pass before the import to Test/UAT is considered successful.

| Gate | Criteria | Verified By |
|------|----------|-------------|
| Critical eval tests | 100% pass rate on all critical conversation test scenarios | Copilot Studio test canvas |
| Solution import health | All components report Healthy status after import | Power Platform Admin Center |
| Flow activation | All Power Automate flows activate successfully with test connections | Flow run history |
| Knowledge source sync | All connected knowledge sources complete an initial sync | Copilot Studio knowledge panel |

### Validation: Stakeholder UAT Sign-Off
- UAT testers and business stakeholders run scripted and freeform test scenarios against the Test/UAT environment.
- UAT exit criteria (from `docs/agent-lifecycle.md`):
  - Resolution rate: 80% or higher.
  - Escalation rate: 20% or lower.
  - User satisfaction (CSAT): 4.0 or higher on a 5-point scale.
- UAT sign-off is documented by the Business Owner before the Test-to-Production promotion is initiated.

## Stage 2: Test/UAT to Production

### Trigger
Manual approval by the Release Manager after all UAT criteria have been met and the Business Owner has provided written sign-off.

### Process
1. Release Manager initiates a production promotion request (GitHub pull request, Azure DevOps release, or manual record depending on organisation tooling).
2. Security Reviewer completes a pre-production security review checklist (see Security Review section below).
3. IT admin imports the same managed solution that was validated in Test/UAT directly into the Production environment. The solution file is not re-exported from Test/UAT -- it is the same artifact promoted from Dev.
   ```
   pac solution import --path ./export/<SolutionName>_managed.zip --environment <prod-env-id>
   ```
4. Environment variables in the Production environment are mapped to production data sources and production Azure Key Vault references (see `environment-variable-matrix.md`).
5. All Power Automate flows are activated using the production service account connections.
6. Knowledge sources are connected and synchronised against production content.
7. Channels (Teams, web chat) are enabled and tested with a smoke test.

### Quality Gate: Test/UAT to Production
All of the following must pass before traffic is switched to the new production version.

| Gate | Criteria | Verified By |
|------|----------|-------------|
| All eval tiers pass thresholds | Conversation tests: critical 100%, high-priority 95%, standard 90% | Copilot Studio test canvas |
| Security review complete | Security checklist signed off (see below) | Security Reviewer |
| UAT sign-off | Business Owner written approval | Release Manager |
| Solution import health | All components Healthy in production after import | Power Platform Admin Center |
| Flow activation | All flows active with production connections | IT Admin |
| Smoke test | Release Manager completes post-import smoke test conversation | Release Manager |
| Monitoring dashboard green | Baseline dashboards configured and showing healthy pre-launch state | Operations |

### Security Review Checklist
- [ ] Authentication enabled for all channels.
- [ ] DLP strict policy applied to production environment.
- [ ] All secrets stored in Azure Key Vault (production vault); no plaintext secrets in solution or environment variable plain values.
- [ ] API key rotation date documented and scheduled.
- [ ] Content safety filters enabled for generative answer topics.
- [ ] Fallback topic does not expose system prompt or internal configuration.
- [ ] Data access scope reviewed: agent can only access data the user is authorised to see.
- [ ] External channel (if applicable) has rate limiting and abuse protection enabled.

### Rollback Procedure
In the event that a production promotion causes failures, revert to the previously known-good managed solution version.

1. Identify the previous managed solution version in the `solution/` directory of the affected agent (use `git log` on the agent's solution directory to find the prior committed version).
2. Import the previous version using the PAC CLI.
   ```
   pac solution import --path ./export/<SolutionName>_previous_managed.zip --environment <prod-env-id>
   ```
3. Verify all components return to Healthy status and flows re-activate.
4. Run the smoke test to confirm the previous version is operating correctly.
5. Document the rollback event: timestamp, cause, impact duration, and corrective action for post-incident review.

The previous managed solution version must always be retained and accessible (do not delete prior exported solution files from source control).

## Extended Pipeline: Integration and Staging Stages

For organisations using the full five-environment topology, two additional stages are inserted between Test/UAT and Production.

### Test/UAT to Integration

| Aspect | Detail |
|--------|--------|
| Trigger | UAT sign-off complete, cross-agent testing required |
| Process | Import managed solution to Integration environment; connect to shared integration data sources |
| Gate | All cross-agent integration test scenarios pass; no regressions in dependent agents |
| Validation | Integration engineer sign-off |

### Integration to Staging

| Aspect | Detail |
|--------|--------|
| Trigger | Integration tests pass |
| Process | Import managed solution to Staging environment (production mirror); map production-equivalent variables |
| Gate | Full eval suite passes; performance test meets SLA thresholds; security review complete |
| Validation | Release Manager and Security Reviewer sign-off |

### Staging to Production

Follows the same process as the Test/UAT to Production stage above, with the Staging-validated solution artifact promoted to Production.

## Pipeline Automation

### GitHub Actions (Recommended)
The following workflow steps automate the Dev-to-Test/UAT promotion on merge to `main`.

```yaml
# Reference only -- adapt to your organisation's pipeline configuration
steps:
  - name: Export solution from Dev
    run: pac solution export --path ./export --name ${{ env.SOLUTION_NAME }} --managed true
    env:
      SOLUTION_NAME: <SolutionName>

  - name: Import solution to Test
    run: pac solution import --path ./export/${{ env.SOLUTION_NAME }}_managed.zip --environment ${{ secrets.TEST_ENV_ID }}
```

The Test-to-Production promotion must remain a **manual** pipeline stage requiring an authorised approver before execution.

### Power Platform Build Tools (Azure DevOps)
Equivalent pipelines are available using the Power Platform Build Tools extension for Azure DevOps. Task names:
- `PowerPlatformExportSolution` for export.
- `PowerPlatformImportSolution` for import.
- Use an Approval gate between Test and Production release stages.

## Promotion Cadence

| Vertical | Recommended Promotion Cadence | Rationale |
|----------|-------------------------------|-----------|
| Coffee | Bi-weekly | Lower risk, internal staff users |
| Clothing | Bi-weekly | Analyst user base; lower change frequency |
| Insurance | Monthly | Regulatory sensitivity; requires thorough security review |
| Tech | Weekly | Higher iteration pace; sales and IT users |
| Transportation | Bi-weekly | Operational safety considerations; anomaly rules require careful validation |

## Artifacts Required per Release

Every promotion to Production must be accompanied by the following artifacts, stored in the `solution/` directory of the relevant agent or in the associated GitHub release.

1. Managed solution export file (`<SolutionName>_managed.zip`).
2. Release notes listing changed topics, flows, knowledge sources, and environment variables.
3. Test evidence: conversation test results, UAT summary, integration test run output.
4. Rollback instructions with a pointer to the prior managed solution version.
5. Communication plan: who is notified, what channel, when.

## Related Documents
- `docs/strategy/environment-topology.md` -- environment tiers and access model.
- `docs/strategy/dlp-policy-templates.md` -- DLP connector policies per environment.
- `docs/strategy/environment-variable-matrix.md` -- variable values per environment per vertical.
- `docs/agent-lifecycle.md` -- lifecycle stage exit criteria and change risk classification.
