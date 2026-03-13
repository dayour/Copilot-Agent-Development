# Power Platform Advisor Knowledge Base: ALM and Environment Strategy

Document owner: Power Platform Advisor agent
Target path: `tech/agents/power-platform-advisor/knowledge/alm-environment-strategy.md`
Audience: Solution architects, platform engineers, makers operating in enterprise ALM and governance contexts
Last reviewed: 2026-03-02

## How to use this document

- Use this as a reference baseline for enterprise decisions on Power Platform ALM and environment governance.
- Use section-level decision trees to choose patterns quickly.
- Use anti-pattern checklists during design reviews, CAB reviews, and release readiness assessments.
- Use command references as copy-ready starters, then parameterize by environment and tenant.

## Source baseline and citations

| Topic | URL |
|---|---|
| Power Platform ALM overview | https://learn.microsoft.com/power-platform/alm/ |
| Solutions overview | https://learn.microsoft.com/power-apps/maker/data-platform/solutions-overview |
| Managed and unmanaged solutions | https://learn.microsoft.com/power-platform/alm/solution-concepts-alm |
| Solution layers | https://learn.microsoft.com/power-apps/maker/data-platform/solution-layers |
| Power Platform Pipelines | https://learn.microsoft.com/power-platform/alm/pipelines |
| Power Platform CLI reference | https://learn.microsoft.com/power-platform/developer/cli/introduction |
| PAC solution commands | https://learn.microsoft.com/power-platform/developer/cli/reference/solution |
| PAC environment commands | https://learn.microsoft.com/power-platform/developer/cli/reference/environment |
| PAC auth commands | https://learn.microsoft.com/power-platform/developer/cli/reference/auth |
| Power Platform Build Tools for Azure DevOps | https://learn.microsoft.com/power-platform/alm/devops-build-tools |
| GitHub Actions for Power Platform | https://learn.microsoft.com/power-platform/alm/devops-github-actions |
| DLP policies | https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention |
| Managed Environments | https://learn.microsoft.com/power-platform/admin/managed-environment-overview |
| Environment strategy and governance | https://learn.microsoft.com/power-platform/guidance/adoption/environment-strategy |
| Dataverse capacity | https://learn.microsoft.com/power-platform/admin/capacity-storage |
| Environment variables | https://learn.microsoft.com/power-apps/maker/data-platform/environmentvariables |
| CoE Starter Kit | https://learn.microsoft.com/power-platform/guidance/coe/starter-kit |
| ALM Accelerator for Power Platform | https://learn.microsoft.com/power-platform/guidance/alm-accelerator/overview |

---

# Part I: ALM (Application Lifecycle Management)

## 1. Solution concepts

### 1.1 What a solution is

- A solution is the ALM unit for transporting customizations and app assets across environments.
- Solutions package metadata and optionally data configurations needed for deployment.
- Solutions provide the boundary for source control, release pipelines, and change governance.

### 1.2 Components included in solutions

- Canvas apps
- Model-driven apps
- Cloud flows
- Desktop flow references
- Dataverse tables and columns
- Relationships and business rules
- Forms and views
- Commands and ribbons
- Security roles
- Connection references
- Environment variables
- Custom connectors
- Plug-ins and custom workflow activities
- PCF controls
- AI Builder components (where supported)
- Site maps
- Dashboards and charts
- Portal/Power Pages artifacts via dedicated tooling

### 1.3 Publishers and prefixes

- Each solution belongs to a publisher with a unique customization prefix.
- Prefixes influence schema names, API names, and component identity in downstream environments.
- Establish one enterprise publisher per bounded domain, not one publisher per developer.
- Prefix changes after artifacts exist are high-cost and usually require recreation.

#### Publisher design rules
- Use short, unique prefixes (2-8 chars) aligned to domain or product line.
- Never use default publisher for production assets.
- Define display name, prefix, and option value range in an architecture decision record.
- Create separate publishers only when independent ownership and release cadence justify it.
- Reserve prefixes for future acquisitions or merger scenarios where namespace collision is likely.

### 1.4 Solution boundary decision tree

```text
Start
  |
  +-- Is this change deployable independently?
       |-- No --> Keep in same solution boundary
       |-- Yes --> Continue
              |
              +-- Different data ownership or security model?
                   |-- Yes --> Separate solution
                   |-- No --> Continue
                          |
                          +-- Different release cadence or SLA?
                               |-- Yes --> Separate solution
                               |-- No --> Same solution, separate feature area
```

## 2. Managed vs unmanaged solutions

### 2.1 Behavioral differences

| Characteristic | Unmanaged | Managed |
|---|---|---|
| Intended environment | Development | Test/UAT/Production |
| Editability in target env | Direct edits allowed | Direct edits restricted to customization layer behavior |
| Uninstall support | Not applicable | Supported when dependencies permit |
| Layering behavior | Base for authored customizations | Layered install package with versioned upgrade path |
| Source of truth | Maker environment and source control | Build artifact from CI |
| Risk profile | High drift risk if promoted directly | Lower drift risk with controlled promotion |

### 2.2 When to use each

- Use unmanaged solutions in developer environments only.
- Use managed solutions for all downstream environments including integration test, UAT, and production.
- Use managed patches for urgent production hotfixes when full upgrade lead time is unacceptable.
- Avoid unmanaged imports into production except for emergency recovery with explicit change waiver.

### 2.3 Layering rules and practical implications

- Lower layers provide baseline definitions; higher layers can override component properties.
- Active layer represents the effective runtime definition after layer resolution.
- Managed properties in upstream layers can block downstream customization attempts.
- Conflict resolution is deterministic by install order and dependency chain, not by intent.

### 2.4 Anti-patterns: managed vs unmanaged

- Importing unmanaged solution to production for convenience.
- Editing managed components directly in test environment and expecting reproducible deployments.
- Mixing unmanaged and managed lifecycle for same app family without policy controls.
- Using default solution as transport mechanism.
- Skipping version increments when re-exporting managed packages.

## 3. Solution layering deep dive

### 3.1 Stack order model

```text
Top of stack: Active layer (runtime effective)
  Managed patch (latest)
  Managed solution upgrade (newer)
  Managed baseline solution
  System/base components
Bottom of stack
```

### 3.2 Conflict resolution and active layer diagnostics

- Validate active layer when behavior differs between environments.
- Inspect recent imports and patches before assuming code defects.
- Remove unmanaged customizations in test/prod when managed behavior is expected.
- Use consistent import sequencing in pipeline stages to avoid non-deterministic outcomes.

### 3.3 Layering governance controls

| Control | Purpose | Owner | Frequency |
|---|---|---|---|
| Layer drift audit | Detect unmanaged modifications in downstream envs | Platform admin | Weekly |
| Import sequence gate | Enforce deterministic stack order | DevOps | Per release |
| Managed properties review | Prevent blocked customizations | Solution architect | Per feature |
| Dependency check | Avoid uninstall/upgrade failures | Release manager | Per deployment |

## 4. Import/export and solution quality gates

### 4.1 PAC CLI core workflow

```bash
pac auth create --url https://org-dev.crm.dynamics.com --name DevSPN --applicationId <appId> --clientSecret <secret> --tenant <tenantId>
pac auth select --name DevSPN
pac solution export --name Contoso_Core --path ./out/Contoso_Core_unmanaged.zip --managed false
pac solution export --name Contoso_Core --path ./out/Contoso_Core_managed.zip --managed true
pac solution check --path ./out/Contoso_Core_unmanaged.zip --geo unitedstates --ruleSet 0ad12346-e108-40b8-a956-9a8f95ea18c9
pac solution import --path ./out/Contoso_Core_managed.zip --publish-changes --async
pac solution publish
```

### 4.2 Import/export sequencing pattern

1. Export unmanaged from development for source capture.
2. Unpack unmanaged into repository for diff and pull request review.
3. Build validation: solution checker, schema validation, dependency validation.
4. Pack managed artifact from repository source.
5. Import managed to integration test, then UAT, then production.
6. Publish customizations and run smoke tests.
7. Tag release with solution version and pipeline run ID.

### 4.3 Solution checker integration

- Run solution checker in CI for every pull request affecting solution source.
- Use fail thresholds by severity: block on critical/high; warn on medium/low with remediation SLA.
- Store checker SARIF or JSON output as build artifact for traceability.
- Link checker findings to work items and enforce closure before release branch merge.

## 5. Power Platform Pipelines (managed deployment)

### 5.1 Stage topology

```text
Developer Environment (unmanaged authoring)
  -> Pipeline Stage: Build/Validation
  -> Test Environment (managed import + automated tests)
  -> UAT Environment (managed import + business sign-off)
  -> Production Environment (managed import + monitored rollout)
```

### 5.2 Deployment rules

- Only managed artifacts cross stage boundaries beyond development.
- Connection references and environment variables must be pre-provisioned or stage-resolved.
- Approvals required for UAT to production promotions.
- Rollback strategy documented per release (patch rollback, restore, or redeploy prior version).
- Pipeline identity must have least-privilege environment roles.

### 5.3 Power Platform pipeline decision tree

```text
Need deployment automation?
  |-- No --> Manual import allowed only for prototypes
  |-- Yes --> Is organization standardized on native pipelines?
            |-- Yes --> Use Power Platform Pipelines + deployment profiles
            |-- No --> Use GitHub Actions or Azure DevOps with pac CLI
```

## 6. CI/CD with GitHub Actions

### 6.1 Reference architecture

```text
GitHub PR -> Validate workflow -> solution unpack diff + checker
Main branch merge -> Build workflow -> managed artifact publish
Release workflow -> deploy to Test/UAT/Prod with approvals
```

### 6.2 Example workflow: PR validation

```yaml
name: pp-solution-pr-validation
on:
  pull_request:
    paths:
      - "solutions/**"
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Power Platform CLI
        uses: microsoft/powerplatform-actions/actions-install@v1
      - name: Authenticate
        uses: microsoft/powerplatform-actions/auth-create@v1
        with:
          app-id: ${{ secrets.PP_APP_ID }}
          client-secret: ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id: ${{ secrets.PP_TENANT_ID }}
          environment-url: ${{ secrets.PP_DEV_URL }}
      - name: Pack solution
        uses: microsoft/powerplatform-actions/pack-solution@v1
        with:
          solution-folder: solutions/Contoso_Core
          solution-file: out/Contoso_Core_unmanaged.zip
          solution-type: Unmanaged
      - name: Run solution checker
        uses: microsoft/powerplatform-actions/checker@v1
        with:
          solution-file: out/Contoso_Core_unmanaged.zip
          rule-set: 0ad12346-e108-40b8-a956-9a8f95ea18c9
```

### 6.3 Example workflow: release deployment

```yaml
name: pp-managed-release
on:
  workflow_dispatch:
jobs:
  deploy-test:
    runs-on: ubuntu-latest
    environment: test
    steps:
      - uses: actions/download-artifact@v4
      - uses: microsoft/powerplatform-actions/actions-install@v1
      - uses: microsoft/powerplatform-actions/auth-create@v1
        with:
          app-id: ${{ secrets.PP_APP_ID }}
          client-secret: ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id: ${{ secrets.PP_TENANT_ID }}
          environment-url: ${{ secrets.PP_TEST_URL }}
      - uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          solution-file: out/Contoso_Core_managed.zip
          publish-changes: true
          overwrite-unmanaged-customizations: false
```

### 6.4 GitHub Actions anti-patterns

- Hard-coding tenant IDs, app secrets, or environment URLs directly in workflow YAML.
- Packing from maker-exported ZIPs instead of source-controlled unpacked content.
- Skipping PR validation and running checker only at release time.
- Deploying unmanaged solutions via release workflow.
- Using one service principal with broad rights to every environment without segmentation.

## 7. CI/CD with Azure DevOps

### 7.1 Power Platform Build Tools tasks in order

1. `PowerPlatformToolInstaller`
2. `PowerPlatformWhoAmi`
3. `PowerPlatformPackSolution or unpack equivalent path`
4. `PowerPlatformChecker`
5. `PowerPlatformImportSolution`
6. `PowerPlatformPublishCustomizations`
7. `PowerPlatformSetSolutionVersion`

### 7.2 Azure DevOps YAML example

```yaml
trigger:
  branches:
    include:
      - main
pool:
  vmImage: ubuntu-latest
stages:
  - stage: Build
    jobs:
      - job: Validate
        steps:
          - task: PowerPlatformToolInstaller@2
          - task: PowerPlatformChecker@2
            inputs:
              authenticationType: PowerPlatformSPN
              PowerPlatformSPN: pp-dev-spn
              FilesToAnalyze: out/Contoso_Core_unmanaged.zip
  - stage: Deploy_Test
    dependsOn: Build
    jobs:
      - deployment: ImportManaged
        environment: pp-test
        strategy:
          runOnce:
            deploy:
              steps:
                - task: PowerPlatformImportSolution@2
                  inputs:
                    authenticationType: PowerPlatformSPN
                    PowerPlatformSPN: pp-test-spn
                    SolutionInputFile: out/Contoso_Core_managed.zip
                    AsyncOperation: true
                    PublishWorkflows: true
```

### 7.3 ADO deployment governance

| Control | Implementation |
|---|---|
| Stage approvals | Environment approvals and checks in release stage |
| Secret handling | Variable groups backed by Key Vault |
| Branch protections | Required reviewers and successful build policy |
| Artifact immutability | Promote same managed zip through all stages |
| Traceability | Tag build with solution version and commit SHA |

## 8. Version control and solution versioning

### 8.1 Version numbering model

- Dataverse solution version uses four-part numeric format: `Major.Minor.Build.Revision`.
- Map semantic intent as follows:
  - Major: breaking change or architectural shift
  - Minor: backward-compatible feature increments
  - Build: CI build number or sprint increment
  - Revision: hotfix sequence

### 8.2 Recommended version policy table

| Change type | Example | Version action |
|---|---|---|
| Breaking table schema | rename/removal impacts consumers | increment Major, reset lower parts |
| New optional feature | new app screen or flow branch | increment Minor |
| Routine deployment | non-breaking updates | increment Build |
| Production hotfix patch | urgent defect fix | increment Revision via patch path |

### 8.3 Git strategy for solution source

- Keep unpacked solution content in a deterministic directory structure.
- Enforce pull-request review for all solution XML and metadata diffs.
- Use branch naming aligned to work item IDs for audit traceability.
- Protect main branch with checker gate and optional deployment dry-run gate.

## 9. Patches vs upgrades

### 9.1 Patch use cases

- Use patches for urgent isolated fixes against an existing managed baseline.
- Keep patches small and short-lived; roll forward into next full upgrade quickly.
- Avoid patch chains that persist across multiple release cycles.

### 9.2 Upgrade behavior

- Upgrade replaces previous managed solution version while preserving data where applicable.
- Stage-for-upgrade workflows can reduce downtime for complex component transitions.
- Some destructive schema changes require explicit migration and may not be safely auto-upgraded.

### 9.3 Delete-and-rebuild caveat

- Delete-and-rebuild is last resort for severe layering corruption or unsupported refactoring paths.
- Requires full dependency inventory, data migration plan, and outage communication.
- Must include rollback and validation runbook before execution.

### 9.4 Patch vs upgrade decision tree

```text
Need emergency production fix?
  |-- No --> Use normal upgrade release
  |-- Yes --> Is fix isolated and low blast radius?
            |-- No --> Fast-track full upgrade
            |-- Yes --> Create managed patch, deploy, then merge into next upgrade
```

## 10. CoE Toolkit ALM integration

### 10.1 ALM Accelerator capabilities

- Git-integrated branching and deployment profile management.
- Standardized pipeline templates for solution export/import and validation.
- Approval workflows and release dashboard views for governance teams.
- Maker-friendly UI abstraction on top of enterprise ALM processes.

### 10.2 Solution management dashboard signals

| Metric | Why it matters | Action threshold |
|---|---|---|
| Unmanaged artifacts in prod | Indicates lifecycle bypass | Immediate incident |
| Checker high severity count | Predicts runtime failures/compliance risks | Block release until zero |
| Time to promote Dev->Prod | Delivery efficiency KPI | Investigate if trend increases >20% |
| Failed imports per month | Pipeline quality measure | Root-cause after each failure |
| Environment variable drift | Config inconsistency risk | Remediate before next deployment |

## 11. PAC CLI deep reference

### 11.1 Authentication commands

```bash
pac auth create --url <envUrl> --name <profileName> --applicationId <appId> --clientSecret <secret> --tenant <tenantId>
```
```bash
pac auth create --url <envUrl> --deviceCode --name DeviceFlowProfile
```
```bash
pac auth list
```
```bash
pac auth select --name <profileName>
```
```bash
pac auth who
```
```bash
pac auth clear
```

### 11.2 Solution commands

```bash
pac solution list
```
```bash
pac solution init --publisher-name Contoso --publisher-prefix cts
```
```bash
pac solution add-reference --path src/MyPlugin/MyPlugin.csproj
```
```bash
pac solution export --name Contoso_Core --path ./out/Contoso_Core_unmanaged.zip --managed false
```
```bash
pac solution export --name Contoso_Core --path ./out/Contoso_Core_managed.zip --managed true
```
```bash
pac solution import --path ./out/Contoso_Core_managed.zip --async --publish-changes
```
```bash
pac solution import --path ./out/Contoso_Core_managed.zip --stage-and-upgrade --async
```
```bash
pac solution publish
```
```bash
pac solution unpack --zipfile ./out/Contoso_Core_unmanaged.zip --folder ./solutions/Contoso_Core --packagetype Unmanaged
```
```bash
pac solution pack --zipfile ./out/Contoso_Core_unmanaged.zip --folder ./solutions/Contoso_Core --packagetype Unmanaged
```
```bash
pac solution online-version --solution-name Contoso_Core --solution-version 2.4.15.0
```
```bash
pac solution check --path ./out/Contoso_Core_unmanaged.zip --geo unitedstates
```

### 11.3 Environment commands

```bash
pac environment list
```
```bash
pac environment select --environment <environmentId>
```
```bash
pac environment who
```
```bash
pac environment copy --source <sourceEnvId> --target <targetEnvName> --type Sandbox
```
```bash
pac environment backup --environment <environmentId> --label pre-release-backup
```
```bash
pac environment restore --environment <environmentId> --backup <backupId>
```
```bash
pac environment delete --environment <environmentId>
```

### 11.4 Connector commands

```bash
pac connector list
```
```bash
pac connector init --api-def ./openapi/contoso-api.json --outputDirectory ./connector
```
```bash
pac connector create --environment <envId> --api-prop ./connector/apiProperties.json --api-def ./openapi/contoso-api.json
```
```bash
pac connector update --environment <envId> --connector-id <connectorId> --api-prop ./connector/apiProperties.json --api-def ./openapi/contoso-api.json
```
```bash
pac connector download --environment <envId> --connector-id <connectorId> --outputDirectory ./connector/exported
```

### 11.5 Copilot commands (capability awareness)

```bash
pac copilot list
```
```bash
pac copilot create --name "AdvisorAgent" --solution "Contoso_Copilot"
```
```bash
pac copilot publish --name "AdvisorAgent"
```
```bash
pac copilot download --name "AdvisorAgent" --path ./copilot/AdvisorAgent
```
- NOTE: Copilot command availability varies by CLI version and feature flighting; verify with `pac help` and release notes.

### 11.6 PAC command selection matrix

| Goal | Preferred command(s) | Notes |
|---|---|---|
| Authenticate with service principal | `pac auth create` | Use secret or cert auth per policy |
| Capture source from environment | `pac solution export + unpack` | Export unmanaged for source control |
| Build deployable artifact | `pac solution pack` | Pack managed for release |
| Run static analysis | `pac solution check` | Fail pipeline on high severity |
| Deploy to target environment | `pac solution import` | Use async for large solutions |
| Finalize runtime changes | `pac solution publish` | Include after imports when needed |
| Inventory environments | `pac environment list` | Use admin profile where required |
| Manage custom connectors | `pac connector create/update` | Keep OpenAPI in source control |

---

# Part II: Environment Strategy

## 12. Environment type taxonomy

| Environment type | Purpose | Dataverse support | Typical ALM role |
|---|---|---|---|
| Default | Personal productivity and broad tenant availability | Optional | Avoid for enterprise app lifecycle |
| Developer | Individual maker/developer sandbox | Yes | Authoring and unit testing |
| Sandbox | Non-production controlled environment | Yes | Integration test, UAT, training |
| Production | Live business operations | Yes | Final managed deployment target |
| Trial | Time-limited evaluation | Usually | Prototyping only, not production source |
| Dataverse for Teams | Team-scoped low-code scenarios | Scoped | Team-level solutions with governance constraints |

### 12.1 Environment type anti-patterns

- Building enterprise line-of-business solution in Default environment.
- Using Trial environment as long-lived integration environment.
- Deploying production workloads into Dataverse for Teams where platform limits are misaligned.
- Allowing shared developer environments for multiple squads without ownership boundaries.

## 13. Environment lifecycle operations

### 13.1 Lifecycle states

```text
Requested -> Provisioned -> Configured -> Active -> Maintained -> Archived/Deleted
```

### 13.2 Lifecycle operations table

| Operation | When to use | Preconditions | Post-checks |
|---|---|---|---|
| Create | New project or isolated workload | Capacity available, security group defined | Baseline DLP and roles applied |
| Backup | Pre-release or before schema migration | Environment healthy | Backup ID recorded in change record |
| Restore | Recover from failed release or data issue | Validated backup point | Smoke tests passed |
| Copy | Seed test environment from production/sandbox | Data privacy scrub policy approved | Connection refs and secrets reset |
| Reset | Recycle non-production environment quickly | No critical artifacts retained | Reapply baseline solution and policies |
| Delete | Retire obsolete environment | Retention and compliance checks complete | Inventory records updated |

### 13.3 Runbook pattern for environment provisioning

1. Create environment in approved region aligned to residency policy.
2. Assign security group and admin roles (least privilege).
3. Attach baseline DLP policy and managed environment settings.
4. Deploy platform baseline solution set (monitoring, shared components).
5. Create connection references and environment variables defaults.
6. Register environment in CoE inventory and ownership catalog.

## 14. DLP policies

### 14.1 Connector classification model

- Business: connectors approved for corporate data processing.
- Non-business: personal or consumer connectors isolated from business group.
- Blocked: disallowed connectors with unacceptable risk profile.

### 14.2 DLP policy design table

| Policy dimension | Recommendation |
|---|---|
| Scope | Start with environment-group policy for enterprise environments; use tenant-wide policy for hard blocks |
| HTTP connector | Restrict or block by default; allow only in controlled integration environments |
| Custom connector endpoints | Enforce endpoint filtering and approved domain allow-list |
| Exception handling | Time-bound exception process with risk sign-off |
| Monitoring | Weekly policy impact and violation review via CoE reports |

### 14.3 DLP decision tree

```text
Need connector in production?
  |-- Is connector approved business class?
        |-- Yes --> Allow in business group
        |-- No --> Is there a compliant alternative?
                  |-- Yes --> Use alternative and block connector
                  |-- No --> Submit exception with compensating controls
```

### 14.4 DLP anti-patterns

- Setting permissive tenant-wide policy and relying on maker discipline alone.
- Allowing HTTP connector globally without endpoint restrictions.
- Classifying same connector differently across sibling production environments without rationale.
- Creating permanent exceptions with no expiry date or owner.

## 15. Security groups and environment access control

- Bind environments to Microsoft Entra ID security groups for membership-driven access.
- Separate admin, maker, and app-user groups per environment tier.
- Automate access reviews and remove dormant privileged assignments.
- Use privileged identity management where available for admin elevation.

### 15.1 Role mapping template

| Persona | Entra group | Environment role | Notes |
|---|---|---|---|
| Platform admin | `PP-Prod-Admins` | System Administrator | JIT preferred |
| Release engineer | `PP-Release-Engineers` | System Customizer + deploy rights | No business data broad read unless required |
| Maker | `PP-Dev-Makers` | Environment Maker (dev only) | No prod maker role |
| Support analyst | `PP-Prod-Support` | Custom support role | Read/operate with audited actions |

## 16. Capacity management

### 16.1 Dataverse capacity dimensions

- Database capacity: relational data and metadata storage.
- File capacity: attachments, documents, and binary artifacts.
- Log capacity: auditing and telemetry records.

### 16.2 Capacity governance table

| Capacity type | Monitoring cadence | Alert threshold | Mitigation options |
|---|---|---|---|
| Database | Daily | 80% | Data archival, table optimization, purchase add-on |
| File | Daily | 75% | Move binaries to external store, retention cleanup |
| Log | Weekly | 70% | Adjust audit scope, retention tuning |

### 16.3 Capacity anti-patterns

- Ignoring log growth until environment operations are degraded.
- Storing large files in Dataverse without lifecycle policy.
- Copying production data repeatedly into multiple sandboxes without retention cleanup.
- No ownership assigned for capacity dashboards and remediation actions.

## 17. Geo and region strategy

- Select environment region based on data residency obligations and user latency profile.
- Avoid cross-geo data movement unless explicitly approved and documented.
- For sovereign clouds, validate connector availability and feature parity before design commitment.
- Plan integration patterns for multi-geo tenants with central governance and local compliance.

### 17.1 Region selection decision tree

```text
Workload contains regulated data?
  |-- Yes --> Choose compliant in-country or approved sovereign region
  |-- No --> Choose nearest region to primary user base
Need cross-geo integration?
  |-- Yes --> Assess legal transfer controls + latency + connector constraints
  |-- No --> Keep single-geo topology
```

## 18. CoE Toolkit for environment management

- Use CoE inventory to track environment owners, purpose, and compliance posture.
- Enable compliance components to detect orphan environments and high-risk connector usage.
- Integrate environment lifecycle workflows with governance approvals.
- Use trend reporting to spot growth hotspots and unmanaged sprawl.

### 18.1 Environment compliance checks

- [ ] Environment has named business owner and technical owner.
- [ ] DLP policy assigned and reviewed within SLA window.
- [ ] Managed environment settings aligned to tier policy.
- [ ] No production workload in trial/default environments.
- [ ] Capacity utilization under warning thresholds.
- [ ] Backup and restore test evidence exists for production tiers.

## 19. Tenant isolation and cross-tenant controls

- Define outbound connector restrictions for external tenants/domains.
- Gate inbound API integrations through approved identity and network controls.
- Validate B2B and guest scenarios for data exfiltration risk.
- Document tenant boundary assumptions in architecture decision records.

### 19.1 Tenant isolation anti-patterns

- Allowing unrestricted outbound HTTP calls from production environments.
- Using shared service principals across multiple tenants without scoped permissions.
- No audit trail for cross-tenant data synchronization jobs.
- Embedding external tenant secrets directly inside cloud flow definitions.

## 20. Environment variables deep guide

### 20.1 Variable types

| Type | Typical use | Deployment behavior |
|---|---|---|
| Text | Endpoint names, feature flags, labels | Set per stage in deployment settings |
| Number | Timeouts, limits, thresholds | Set per stage with validation guardrails |
| Yes/No | Toggle optional features | Promote with explicit release note impact |
| JSON | Structured config payloads | Validate schema before import |
| Data Source | Connector/table references | Map to stage-specific connection references |
| Secret | Credentials and keys via secure provider | Resolve from secret store at deployment time |

### 20.2 Usage patterns

- Keep variable definitions in solution; keep values stage-specific.
- Use naming convention: `<Domain>.<Component>.<Setting>`.
- Define default values only for non-sensitive dev-safe settings.
- Never store secrets as plain text variables; use secret type and secure references.
- Validate required variables before solution import in pipeline pre-check stage.

### 20.3 Example deployment mapping

| Variable name | Dev | Test | Prod |
|---|---|---|---|
| `Sales.API.BaseUrl` | `https://api-dev.contoso.com` | `https://api-test.contoso.com` | `https://api.contoso.com` |
| `Sales.Feature.EnableForecastV2` | `true` | `true` | `false` (enable by change ticket) |
| `Sales.API.TimeoutSeconds` | `30` | `20` | `15` |
| `Sales.API.Credential` | Secret ref: `kv/dev/sales-api` | Secret ref: `kv/test/sales-api` | Secret ref: `kv/prod/sales-api` |

---

# Part III: Decision frameworks, anti-pattern catalog, and operational playbooks

## 21. End-to-end ALM operating model

```text
Plan -> Build -> Validate -> Package -> Deploy -> Verify -> Observe -> Improve
```

### 21.1 Plan
- Define solution boundaries and publisher strategy.
- Map dependencies and release blast radius.
- Document environment variable and connection reference plan.

### 21.2 Build
- Author in unmanaged dev environment.
- Commit unpacked source with branch policy.
- Run unit-level checks and maker diagnostics.

### 21.3 Validate
- Run solution checker and policy checks.
- Perform static diff review for sensitive components.
- Validate connector and DLP conformance.

### 21.4 Package
- Pack managed artifact with immutable version.
- Generate release manifest with commit SHA.
- Sign and store artifacts in secure feed.

### 21.5 Deploy
- Promote same artifact through test, UAT, prod.
- Apply approvals and release windows.
- Capture import logs and telemetry.

### 21.6 Verify
- Run smoke tests and regression suite.
- Validate active layer expectations.
- Confirm monitoring and alerts green.

### 21.7 Observe
- Track capacity, failures, policy violations.
- Review mean time to restore and release success rate.
- Feed findings into backlog.

### 21.8 Improve
- Retire anti-patterns and standardize templates.
- Refine pipeline quality gates.
- Update architecture guidance and runbooks.

## 22. Anti-pattern catalog

| Anti-pattern | Why harmful | Preferred pattern |
|---|---|---|
| Default-solution-first delivery | No lifecycle control or reproducible transport | Dedicated domain solution with publisher |
| Production unmanaged edits | Creates drift and rollback uncertainty | Managed-only downstream deployments |
| One giant solution for all apps | Couples release cadences and increases blast radius | Bounded-domain modular solutions |
| No connection reference strategy | Broken deployments across stages | Stage-mapped connection references with preflight checks |
| Secrets in flow definitions | Credential exposure risk | Secret environment variables + secure store |
| Skipped checker in CI | Late discovery of severe defects | Checker gate on PR and main builds |
| Manual imports without records | No auditability | Pipeline-based imports with logs and approvals |
| Unbounded connector sprawl | DLP and exfiltration risk | Catalog with business/non-business governance |
| No capacity ownership | Unexpected outages and blocked operations | Named owners + threshold remediation runbooks |
| Patch chains not consolidated | Complex layering and support overhead | Roll patches into next full upgrade quickly |

## 23. Release readiness checklist

1. [ ] Solution version incremented and release notes completed.
2. [ ] Managed artifact generated from source-controlled unpacked solution.
3. [ ] Solution checker high/critical findings resolved or waived formally.
4. [ ] Connection references resolved for target stage.
5. [ ] Environment variables validated for target stage.
6. [ ] DLP policy compliance verified for all connectors used.
7. [ ] Backup completed (or verified recent backup) before production import.
8. [ ] Rollback plan documented and tested.
9. [ ] Smoke tests defined and automated where feasible.
10. [ ] Approvals completed in change management system.

## 24. Operational KPIs

| KPI | Definition | Target |
|---|---|---|
| Deployment success rate | Successful imports / total imports | > 98% |
| Change failure rate | Deployments causing incident / total deployments | < 10% |
| Mean time to restore | Time from incident start to service recovery | < 60 min for critical apps |
| Checker debt backlog | Open high/critical checker issues | 0 at release branch |
| Environment drift count | Unmanaged modifications in non-dev envs | 0 |
| Capacity threshold breaches | Count of environments over warning threshold | Downward trend month over month |

## 25. Reference GitHub Actions pipeline blueprint

```yaml
name: power-platform-enterprise-alm
on:
  pull_request:
    branches: [ main ]
    paths:
      - "solutions/**"
  push:
    branches: [ main ]
  workflow_dispatch:
permissions:
  contents: read
  actions: read
jobs:
  pr_validate:
    if: github.event_name == "pull_request"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/powerplatform-actions/actions-install@v1
      - uses: microsoft/powerplatform-actions/auth-create@v1
        with:
          app-id: ${{ secrets.PP_APP_ID }}
          client-secret: ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id: ${{ secrets.PP_TENANT_ID }}
          environment-url: ${{ secrets.PP_DEV_URL }}
      - uses: microsoft/powerplatform-actions/pack-solution@v1
        with:
          solution-folder: solutions/Contoso_Core
          solution-file: out/Contoso_Core_unmanaged.zip
          solution-type: Unmanaged
      - uses: microsoft/powerplatform-actions/checker@v1
        with:
          solution-file: out/Contoso_Core_unmanaged.zip
          rule-set: 0ad12346-e108-40b8-a956-9a8f95ea18c9
  build_artifact:
    if: github.event_name != "pull_request"
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.solution_version }}
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/powerplatform-actions/actions-install@v1
      - id: version
        run: |
          echo "solution_version=2.5.${{ github.run_number }}.0" >> $GITHUB_OUTPUT
      - uses: microsoft/powerplatform-actions/pack-solution@v1
        with:
          solution-folder: solutions/Contoso_Core
          solution-file: out/Contoso_Core_managed.zip
          solution-type: Managed
      - uses: actions/upload-artifact@v4
        with:
          name: managed-solution
          path: out/Contoso_Core_managed.zip
  deploy_test:
    needs: build_artifact
    runs-on: ubuntu-latest
    environment: pp-test
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: managed-solution
          path: out
      - uses: microsoft/powerplatform-actions/actions-install@v1
      - uses: microsoft/powerplatform-actions/auth-create@v1
        with:
          app-id: ${{ secrets.PP_APP_ID }}
          client-secret: ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id: ${{ secrets.PP_TENANT_ID }}
          environment-url: ${{ secrets.PP_TEST_URL }}
      - uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          solution-file: out/Contoso_Core_managed.zip
          publish-changes: true
          overwrite-unmanaged-customizations: false
      - run: echo "Execute integration smoke tests here"
  deploy_prod:
    needs: deploy_test
    runs-on: ubuntu-latest
    environment: pp-prod
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: managed-solution
          path: out
      - uses: microsoft/powerplatform-actions/actions-install@v1
      - uses: microsoft/powerplatform-actions/auth-create@v1
        with:
          app-id: ${{ secrets.PP_APP_ID }}
          client-secret: ${{ secrets.PP_CLIENT_SECRET }}
          tenant-id: ${{ secrets.PP_TENANT_ID }}
          environment-url: ${{ secrets.PP_PROD_URL }}
      - uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          solution-file: out/Contoso_Core_managed.zip
          publish-changes: true
          overwrite-unmanaged-customizations: false
      - run: echo "Run post-deploy verification and notify ops"
```

## 26. Reference Azure DevOps pipeline blueprint

```yaml
trigger:
  branches:
    include:
      - main
variables:
  solutionName: Contoso_Core
  buildConfiguration: Release
pool:
  vmImage: ubuntu-latest
stages:
- stage: Validate
  jobs:
  - job: ValidateSolution
    steps:
    - task: PowerPlatformToolInstaller@2
    - task: PowerPlatformExportSolution@2
      inputs:
        authenticationType: PowerPlatformSPN
        PowerPlatformSPN: pp-dev-spn
        SolutionName: $(solutionName)
        SolutionOutputFile: $(Build.SourcesDirectory)/out/$(solutionName)_unmanaged.zip
        Managed: false
    - task: PowerPlatformUnpackSolution@2
      inputs:
        SolutionInputFile: $(Build.SourcesDirectory)/out/$(solutionName)_unmanaged.zip
        SolutionTargetFolder: $(Build.SourcesDirectory)/solutions/$(solutionName)
        SolutionType: Unmanaged
    - task: PowerPlatformChecker@2
      inputs:
        authenticationType: PowerPlatformSPN
        PowerPlatformSPN: pp-dev-spn
        FilesToAnalyze: $(Build.SourcesDirectory)/out/$(solutionName)_unmanaged.zip
- stage: Build
  dependsOn: Validate
  jobs:
  - job: BuildManaged
    steps:
    - task: PowerPlatformPackSolution@2
      inputs:
        SolutionSourceFolder: $(Build.SourcesDirectory)/solutions/$(solutionName)
        SolutionOutputFile: $(Build.ArtifactStagingDirectory)/$(solutionName)_managed.zip
        SolutionType: Managed
    - publish: $(Build.ArtifactStagingDirectory)
      artifact: drop
- stage: Deploy_Test
  dependsOn: Build
  jobs:
  - deployment: DeployTest
    environment: pp-test
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          - task: PowerPlatformImportSolution@2
            inputs:
              authenticationType: PowerPlatformSPN
              PowerPlatformSPN: pp-test-spn
              SolutionInputFile: $(Pipeline.Workspace)/drop/$(solutionName)_managed.zip
              AsyncOperation: true
              PublishWorkflows: true
- stage: Deploy_Prod
  dependsOn: Deploy_Test
  jobs:
  - deployment: DeployProd
    environment: pp-prod
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          - task: PowerPlatformImportSolution@2
            inputs:
              authenticationType: PowerPlatformSPN
              PowerPlatformSPN: pp-prod-spn
              SolutionInputFile: $(Pipeline.Workspace)/drop/$(solutionName)_managed.zip
              AsyncOperation: true
              PublishWorkflows: true
          - task: PowerPlatformPublishCustomizations@2
            inputs:
              authenticationType: PowerPlatformSPN
              PowerPlatformSPN: pp-prod-spn
```

## 27. PAC CLI quick cookbook

### 27.1 Initialize local solution project
```bash
pac solution init --publisher-name Contoso --publisher-prefix cts
```

### 27.2 Authenticate using device code
```bash
pac auth create --deviceCode --url https://org.crm.dynamics.com --name DeviceProfile
```

### 27.3 Switch environment profile
```bash
pac auth select --name DevSPN
```

### 27.4 Export managed package
```bash
pac solution export --name Contoso_Core --path ./out/managed.zip --managed true
```

### 27.5 Import managed package
```bash
pac solution import --path ./out/managed.zip --publish-changes --async
```

### 27.6 Run checker before import
```bash
pac solution check --path ./out/unmanaged.zip --geo unitedstates
```

### 27.7 Set solution version
```bash
pac solution online-version --solution-name Contoso_Core --solution-version 3.1.42.0
```

### 27.8 List environments
```bash
pac environment list
```

### 27.9 List connectors in environment
```bash
pac connector list
```

### 27.10 Create custom connector
```bash
pac connector create --environment <envId> --api-def ./openapi.json --api-prop ./apiProperties.json
```

## 28. Governance findings template for advisor outputs

| Finding | Area | Severity (High/Medium/Low) | Remediation |
|---|---|---|---|
| Production environment allows unmanaged imports | ALM | High | Restrict import rights and enforce managed-only pipeline |
| HTTP connector enabled without endpoint restrictions | DLP | High | Apply endpoint filtering and exception workflow |
| No environment variable strategy for endpoints | Configuration | Medium | Introduce typed env vars and stage mappings |
| No backup verification before releases | Operations | Medium | Automate pre-release backup check gate |
| Capacity dashboard not monitored weekly | Platform governance | Low | Assign owner and recurring review cadence |

## 29. ADO tasks (WIQL-ready work item definitions)

### 29.1 Work Item Title: Establish Power Platform publisher strategy
**Description**
Define enterprise publisher model, prefixes, and ownership boundaries for all production solutions.

**Acceptance Criteria**
- ADR approved with prefix taxonomy.
- Default publisher banned for production assets.
- Governance checklist updated.

### 29.2 Work Item Title: Implement managed-only release policy
**Description**
Enforce managed solution deployment for all non-development environments through CI/CD gates.

**Acceptance Criteria**
- Pipeline blocks unmanaged imports.
- Prod role access restricted.
- Audit report shows zero unmanaged imports.

### 29.3 Work Item Title: Deploy DLP baseline for enterprise environments
**Description**
Create and apply DLP policies with connector classification and HTTP restrictions.

**Acceptance Criteria**
- Policy assigned to all prod/test envs.
- Exceptions process documented.
- Monthly review cadence established.

### 29.4 Work Item Title: Standardize environment variable framework
**Description**
Define typed environment variable catalog and deployment-time value mappings per stage.

**Acceptance Criteria**
- Naming convention published.
- Secrets moved to secure references.
- Preflight validation step in pipeline.

### 29.5 Work Item Title: Enable solution checker gate in PR validation
**Description**
Integrate checker in GitHub Actions/Azure DevOps and block high-severity findings.

**Acceptance Criteria**
- PR validation fails on high/critical.
- Findings stored as build artifact.
- SLA policy for remediation approved.

### 29.6 Work Item Title: Create production backup and rollback runbook
**Description**
Define backup validation and restoration procedures prior to each production deployment.

**Acceptance Criteria**
- Runbook approved by operations.
- Test restore performed quarterly.
- Release checklist includes backup confirmation.

## 30. Frequently made architecture decisions

1. **Decision:** Should production ever receive unmanaged solutions?
   - **Guidance:** No, except documented emergency break-glass with retrospective correction to managed lifecycle.
2. **Decision:** Should each squad own its own publisher?
   - **Guidance:** Only when bounded contexts and release autonomy justify namespace separation.
3. **Decision:** Should we copy production data to test by default?
   - **Guidance:** No, require privacy review, minimization, and masking controls.
4. **Decision:** Should HTTP connector be globally enabled?
   - **Guidance:** No, restrict by default and use approved integration patterns.
5. **Decision:** Should patches be long-lived?
   - **Guidance:** No, consolidate patches into the next full upgrade rapidly.
6. **Decision:** Should solution checker warnings block releases?
   - **Guidance:** Block on high/critical by default; medium/low based on policy and risk.

## 31. Extended citation list by topic

| Topic | URL |
|---|---|
| Solutions and layering | https://learn.microsoft.com/power-platform/alm/solution-concepts-alm |
| Solution layers and active layer | https://learn.microsoft.com/power-apps/maker/data-platform/solution-layers |
| Pipelines in Power Platform | https://learn.microsoft.com/power-platform/alm/pipelines |
| GitHub Actions for Power Platform | https://learn.microsoft.com/power-platform/alm/devops-github-actions |
| Azure DevOps Build Tools | https://learn.microsoft.com/power-platform/alm/devops-build-tools |
| Power Platform CLI intro | https://learn.microsoft.com/power-platform/developer/cli/introduction |
| PAC auth reference | https://learn.microsoft.com/power-platform/developer/cli/reference/auth |
| PAC solution reference | https://learn.microsoft.com/power-platform/developer/cli/reference/solution |
| PAC environment reference | https://learn.microsoft.com/power-platform/developer/cli/reference/environment |
| PAC connector reference | https://learn.microsoft.com/power-platform/developer/cli/reference/connector |
| Environment variables | https://learn.microsoft.com/power-apps/maker/data-platform/environmentvariables |
| DLP policies | https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention |
| Managed environments | https://learn.microsoft.com/power-platform/admin/managed-environment-overview |
| Capacity management | https://learn.microsoft.com/power-platform/admin/capacity-storage |
| CoE Starter Kit | https://learn.microsoft.com/power-platform/guidance/coe/starter-kit |
| ALM Accelerator | https://learn.microsoft.com/power-platform/guidance/alm-accelerator/overview |
| Environment strategy | https://learn.microsoft.com/power-platform/guidance/adoption/environment-strategy |

## 32. Appendices

### 32.1 Command safety checklist
- [ ] Validate active `pac auth` profile before any import or delete action.
- [ ] Never run destructive `pac environment delete` without explicit change approval.
- [ ] Always export backup before major production upgrade.
- [ ] Use `--async` for large solution imports and poll status.
- [ ] Capture CLI logs into pipeline artifacts for post-incident analysis.

### 32.2 Enterprise naming conventions

| Artifact | Convention example |
|---|---|
| Publisher prefix | `cts` for Contoso core platform |
| Solution name | `Contoso_Sales_Core` |
| Connection reference | `cr_Contoso_SalesApi` |
| Environment variable | `Sales.API.BaseUrl` |
| Service principal | `spn-pp-prod-deploy` |
| Pipeline name | `pp-sales-core-release` |

### 32.3 Troubleshooting matrix

| Symptom | Likely cause | Resolution |
|---|---|---|
| Solution import fails on dependency | Missing prerequisite component in target env | Import dependency first or include in release bundle |
| Flow disabled after import | Connection reference not mapped | Rebind connection references in target stage |
| Unexpected app behavior after upgrade | Layer conflict from unmanaged change | Remove unmanaged layer and re-import managed |
| Checker finds connector policy issue | Disallowed connector usage | Refactor to approved connector or submit exception |
| Capacity alerts keep recurring | No archival strategy | Implement retention and data offloading policy |

### 32.4 Change advisory board summary template

- Change ID: <CAB-XXXX>
- Solution: <Name and Version>
- Environment path: Dev -> Test -> UAT -> Prod
- Risk level: <Low/Medium/High>
- Pre-deployment backup: <Backup ID>
- Checker status: <Pass/Fail + link>
- DLP impact: <None/Reviewed/Exception>
- Rollback plan: <Patch rollback or restore plan reference>
- Business sign-off: <Approver and timestamp>
- Operations sign-off: <Approver and timestamp>

### 32.5 Deep-dive command index (expanded)

| Area | Command | Variant | Example |
|---|---|---|---|
| auth | create | basic | `pac auth create` |
| auth | create | ci | `pac auth create --verbose` |
| auth | create | troubleshooting | `pac auth create --help` |
| auth | list | basic | `pac auth list` |
| auth | list | ci | `pac auth list --verbose` |
| auth | list | troubleshooting | `pac auth list --help` |
| auth | select | basic | `pac auth select` |
| auth | select | ci | `pac auth select --verbose` |
| auth | select | troubleshooting | `pac auth select --help` |
| auth | who | basic | `pac auth who` |
| auth | who | ci | `pac auth who --verbose` |
| auth | who | troubleshooting | `pac auth who --help` |
| auth | clear | basic | `pac auth clear` |
| auth | clear | ci | `pac auth clear --verbose` |
| auth | clear | troubleshooting | `pac auth clear --help` |
| solution | list | basic | `pac solution list` |
| solution | list | ci | `pac solution list --verbose` |
| solution | list | troubleshooting | `pac solution list --help` |
| solution | export | basic | `pac solution export` |
| solution | export | ci | `pac solution export --verbose` |
| solution | export | troubleshooting | `pac solution export --help` |
| solution | import | basic | `pac solution import` |
| solution | import | ci | `pac solution import --verbose` |
| solution | import | troubleshooting | `pac solution import --help` |
| solution | pack | basic | `pac solution pack` |
| solution | pack | ci | `pac solution pack --verbose` |
| solution | pack | troubleshooting | `pac solution pack --help` |
| solution | unpack | basic | `pac solution unpack` |
| solution | unpack | ci | `pac solution unpack --verbose` |
| solution | unpack | troubleshooting | `pac solution unpack --help` |
| solution | publish | basic | `pac solution publish` |
| solution | publish | ci | `pac solution publish --verbose` |
| solution | publish | troubleshooting | `pac solution publish --help` |
| solution | check | basic | `pac solution check` |
| solution | check | ci | `pac solution check --verbose` |
| solution | check | troubleshooting | `pac solution check --help` |
| solution | online-version | basic | `pac solution online-version` |
| solution | online-version | ci | `pac solution online-version --verbose` |
| solution | online-version | troubleshooting | `pac solution online-version --help` |
| solution | clone | basic | `pac solution clone` |
| solution | clone | ci | `pac solution clone --verbose` |
| solution | clone | troubleshooting | `pac solution clone --help` |
| environment | list | basic | `pac environment list` |
| environment | list | ci | `pac environment list --verbose` |
| environment | list | troubleshooting | `pac environment list --help` |
| environment | select | basic | `pac environment select` |
| environment | select | ci | `pac environment select --verbose` |
| environment | select | troubleshooting | `pac environment select --help` |
| environment | who | basic | `pac environment who` |
| environment | who | ci | `pac environment who --verbose` |
| environment | who | troubleshooting | `pac environment who --help` |
| environment | backup | basic | `pac environment backup` |
| environment | backup | ci | `pac environment backup --verbose` |
| environment | backup | troubleshooting | `pac environment backup --help` |
| environment | restore | basic | `pac environment restore` |
| environment | restore | ci | `pac environment restore --verbose` |
| environment | restore | troubleshooting | `pac environment restore --help` |
| environment | copy | basic | `pac environment copy` |
| environment | copy | ci | `pac environment copy --verbose` |
| environment | copy | troubleshooting | `pac environment copy --help` |
| environment | delete | basic | `pac environment delete` |
| environment | delete | ci | `pac environment delete --verbose` |
| environment | delete | troubleshooting | `pac environment delete --help` |
| connector | list | basic | `pac connector list` |
| connector | list | ci | `pac connector list --verbose` |
| connector | list | troubleshooting | `pac connector list --help` |
| connector | create | basic | `pac connector create` |
| connector | create | ci | `pac connector create --verbose` |
| connector | create | troubleshooting | `pac connector create --help` |
| connector | update | basic | `pac connector update` |
| connector | update | ci | `pac connector update --verbose` |
| connector | update | troubleshooting | `pac connector update --help` |
| connector | download | basic | `pac connector download` |
| connector | download | ci | `pac connector download --verbose` |
| connector | download | troubleshooting | `pac connector download --help` |
| copilot | list | basic | `pac copilot list` |
| copilot | list | ci | `pac copilot list --verbose` |
| copilot | list | troubleshooting | `pac copilot list --help` |
| copilot | create | basic | `pac copilot create` |
| copilot | create | ci | `pac copilot create --verbose` |
| copilot | create | troubleshooting | `pac copilot create --help` |
| copilot | publish | basic | `pac copilot publish` |
| copilot | publish | ci | `pac copilot publish --verbose` |
| copilot | publish | troubleshooting | `pac copilot publish --help` |
| copilot | download | basic | `pac copilot download` |
| copilot | download | ci | `pac copilot download --verbose` |
| copilot | download | troubleshooting | `pac copilot download --help` |

### 32.6 Final recommendations
- Treat managed artifacts as immutable release units.
- Separate environment strategy from project convenience; enforce policy centrally.
- Adopt a layered governance model: preventive controls, detective controls, corrective runbooks.
- Institutionalize ALM as a product capability, not a one-time setup.
- Continuously improve through metrics, incident learnings, and template hardening.

## 33. Scenario playbooks

### 33.1 Emergency hotfix in production
- Objective: Use managed patch flow, pre-backup, minimal scope import, and immediate post-validation.
- Entry criteria: Change ticket approved, owner assigned, communication plan prepared.
- Execution steps:
  1. Validate prerequisites and backups.
  2. Execute deployment or governance action in controlled window.
  3. Run smoke tests and compliance checks.
  4. Publish completion summary with evidence links.
- Exit criteria: Target KPI stable for 24 hours and no high severity incidents.

### 33.2 Cross-team shared component release
- Objective: Version shared solution first, then dependent solutions in defined order.
- Entry criteria: Change ticket approved, owner assigned, communication plan prepared.
- Execution steps:
  1. Validate prerequisites and backups.
  2. Execute deployment or governance action in controlled window.
  3. Run smoke tests and compliance checks.
  4. Publish completion summary with evidence links.
- Exit criteria: Target KPI stable for 24 hours and no high severity incidents.

### 33.3 Environment regional migration
- Objective: Create target region env, deploy managed solution, migrate data, cut over with freeze window.
- Entry criteria: Change ticket approved, owner assigned, communication plan prepared.
- Execution steps:
  1. Validate prerequisites and backups.
  2. Execute deployment or governance action in controlled window.
  3. Run smoke tests and compliance checks.
  4. Publish completion summary with evidence links.
- Exit criteria: Target KPI stable for 24 hours and no high severity incidents.

### 33.4 DLP policy tightening program
- Objective: Classify connector usage, notify owners, remediate alternatives, enforce block in phases.
- Entry criteria: Change ticket approved, owner assigned, communication plan prepared.
- Execution steps:
  1. Validate prerequisites and backups.
  2. Execute deployment or governance action in controlled window.
  3. Run smoke tests and compliance checks.
  4. Publish completion summary with evidence links.
- Exit criteria: Target KPI stable for 24 hours and no high severity incidents.

### 33.5 Capacity crisis response
- Objective: Stop non-essential jobs, archive data, purchase add-on, execute optimization backlog.
- Entry criteria: Change ticket approved, owner assigned, communication plan prepared.
- Execution steps:
  1. Validate prerequisites and backups.
  2. Execute deployment or governance action in controlled window.
  3. Run smoke tests and compliance checks.
  4. Publish completion summary with evidence links.
- Exit criteria: Target KPI stable for 24 hours and no high severity incidents.

## 34. Decision records template

```markdown
# ADR-PP-XXX: <Decision Title>
## Context
- Business driver:
- Technical constraints:
- Compliance constraints:
## Decision
- Chosen option:
- Scope and boundaries:
## Consequences
- Positive outcomes:
- Trade-offs:
## Operationalization
- Pipeline updates:
- Governance controls:
- Rollback approach:
```

## 35. Environment tier baseline matrix

| Control | Dev | Test | UAT | Prod |
|---|---|---|---|---|
| Managed environment | Optional | Yes | Yes | Yes |
| Maker role breadth | Broad | Limited | Limited | Minimal |
| DLP strictness | Moderate | High | High | Highest |
| Backup frequency | Weekly | Daily | Daily | Daily + retention policy |
| Deployment source | Manual or CI | CI only | CI only | CI only with approvals |
| Monitoring depth | Basic | Standard | Standard | Enhanced with on-call |

## 36. Closing guidance

- ALM maturity is not measured by tool adoption alone; it is measured by repeatability, recoverability, and governance evidence.
- Environment strategy must be explicit and policy-backed, not tribal knowledge.
- The fastest teams in production are those with the strongest pre-deployment controls and the clearest rollback paths.
