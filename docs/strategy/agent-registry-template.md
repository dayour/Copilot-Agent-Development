# Agent Registry Template

## Overview

This document provides the schema and a pre-populated template for the Central Agent Registry maintained by the CoE. The registry is the authoritative source of record for every Copilot Studio agent in the fleet.

The registry is stored in the `AgentRegistry` Dataverse table in the CoE environment. This Markdown file serves as the human-readable reference and the seed data source for initial population.

See [coe-governance.md](./coe-governance.md) for governance rules that reference this registry.

---

## Registry Schema

### Core Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| AgentID | Text (auto) | Yes | Unique identifier (format: `<vertical>-<agent-name>`, e.g., `coffee-virtual-coach`) |
| AgentName | Text | Yes | Human-readable agent name matching the repository folder name |
| Vertical | Choice | Yes | Coffee, Clothing, Insurance, Tech, or Transportation |
| AgentOwner | Text | Yes | Full name of the named individual responsible for the agent |
| OwnerEmail | Email | Yes | Email address of the agent owner |
| VerticalLead | Text | Yes | Full name of the vertical lead who oversees this agent |
| Status | Choice | Yes | Development, Testing, Staging, Production, Retired |
| Tier | Choice | Yes | P0, P1, or P2 -- see sla-definitions.md for tier definitions |
| ProductionEnvironmentID | Text | Conditional | Power Platform environment GUID for the production instance (required when Status = Production) |
| StagingEnvironmentID | Text | No | Power Platform environment GUID for the staging instance |
| DevEnvironmentID | Text | No | Power Platform environment GUID for the development instance |
| SolutionVersion | Text | Yes | Semantic version of the currently deployed solution (major.minor.patch) |
| LastProductionPromotion | Date | Conditional | Date of the most recent deployment to production (required when Status = Production) |
| LastUpdated | Date | Yes | Date the registry record was last modified |

### Quality Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| ScaffoldComplete | Yes/No | Yes | True if all four scaffold files are present in source control |
| LastEvalResolutionRate | Decimal | Conditional | Resolution rate from the most recent UAT (required before production promotion) |
| LastEvalCSAT | Decimal | Conditional | CSAT score (1.0 to 5.0) from the most recent UAT |
| EvalEvidenceLink | URL | Conditional | Link to the UAT summary document or pull request with eval evidence |
| InstructionQualityReviewed | Yes/No | Yes | True if the CoE admin has reviewed instruction quality |
| InstructionQualityReviewDate | Date | Conditional | Date of the most recent instruction quality review |

### Knowledge Source Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| KnowledgeSourceCount | Integer | Yes | Number of connected knowledge sources |
| KnowledgeSourceURLs | Multiline Text | No | Comma-separated list of SharePoint URLs or document set paths |
| LastKnowledgeSourceRefresh | Date | Yes | Date of the most recent knowledge source sync |
| KnowledgeSourceStatus | Choice | Yes | Fresh (refreshed within 90 days) or Stale (not refreshed within 90 days) |

### Security Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| AuthenticationMode | Choice | Yes | Azure AD, Azure AD B2C, None (internal only) |
| ManualAuthInProduction | Yes/No | Yes | True if the agent uses manual authentication in production (must be False) |
| DLPPolicyAssigned | Yes/No | Yes | True if a DLP policy is assigned to the production environment |
| ConnectorCertificationStatus | Choice | Yes | All Certified, Pending Review, or Violation |
| DataResidencyRegion | Text | Yes | Azure region where the production Dataverse environment is hosted |
| LastSecurityAuditDate | Date | No | Date of the most recent security compliance audit |

### Operational Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| PrimaryChannel | Text | Yes | Primary deployment channel (Teams, Web Chat, Power Apps, or External) |
| AdditionalChannels | Multiline Text | No | Comma-separated list of additional channels |
| MonthlyActiveUsers | Integer | No | MAU from the most recent calendar month |
| Last30DayResolutionRate | Decimal | No | Resolution rate from the last 30 days of production traffic |
| Last30DayEscalationRate | Decimal | No | Escalation rate from the last 30 days |
| Last30DayFlowSuccessRate | Decimal | No | Flow success rate from the last 30 days |
| RetirementDate | Date | Conditional | Planned or actual retirement date (required when Status = Retired) |
| RetirementReason | Multiline Text | Conditional | Reason for retirement (required when Status = Retired) |

---

## Current Agent Inventory

The following table reflects the current agent fleet. Update this table with each registry refresh.

### Coffee Vertical

| Field | Value |
| --- | --- |
| AgentID | coffee-virtual-coach |
| AgentName | Virtual Coach |
| Vertical | Coffee |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P2 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

### Clothing Vertical

| Field | Value |
| --- | --- |
| AgentID | clothing-power-analysis |
| AgentName | Power Analysis |
| Vertical | Clothing |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

### Insurance Vertical

| Field | Value |
| --- | --- |
| AgentID | insurance-claims-assistant |
| AgentName | Claims Assistant |
| Vertical | Insurance |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P0 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD B2C |
| PrimaryChannel | Web Chat |
| ScaffoldComplete | Yes |

### Tech Vertical

| Field | Value |
| --- | --- |
| AgentID | tech-it-help-desk |
| AgentName | IT Help Desk |
| Vertical | Tech |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | tech-seller-prospect |
| AgentName | Seller Prospect |
| Vertical | Tech |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | tech-support-bot |
| AgentName | SupportBot |
| Vertical | Tech |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | tech-policy-advisor |
| AgentName | Policy Advisor |
| Vertical | Tech |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | tech-power-platform-advisor |
| AgentName | Power Platform Advisor |
| Vertical | Tech |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

### Transportation Vertical

| Field | Value |
| --- | --- |
| AgentID | transportation-fleet-coordinator |
| AgentName | Fleet Coordinator |
| Vertical | Transportation |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | transportation-fuel-tracking |
| AgentName | Fuel Tracking |
| Vertical | Transportation |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P2 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

| Field | Value |
| --- | --- |
| AgentID | transportation-route-optimizer |
| AgentName | Route Optimizer |
| Vertical | Transportation |
| AgentOwner | (assign owner) |
| Status | Production |
| Tier | P1 |
| SolutionVersion | 1.0.0 |
| AuthenticationMode | Azure AD |
| PrimaryChannel | Teams |
| ScaffoldComplete | Yes |

---

## PAC CLI Inventory Refresh Script

Use this script to enumerate agents in a Power Platform environment and compare against the registry:

```bash
# List all Copilot Studio agents in a target environment
pac chatbot list --environment <environment-id>

# Export the results to a file for registry reconciliation
pac chatbot list --environment <environment-id> > /tmp/agent-inventory-$(date +%Y%m%d).txt
```

After running the script, compare the output against the registry. Agents present in the environment but not in the registry must be investigated. Agents in the registry with status Production but absent from the environment scan are flagged as discrepancies and require immediate review.

---

## Orphan Classification Rules

An agent record is flagged as orphan when any of the following criteria are met:

| Rule | Threshold | Action |
| --- | --- | --- |
| Owner field empty | Any time | Assign owner within 5 business days or retire |
| Owner no longer in organization | Detected via Azure AD lookup | Assign new owner within 14 days |
| No production promotion | 180 days without version bump | Review and reassign or retire |
| No knowledge source refresh | 90 days | Notify owner; escalate if not resolved in 14 days |
| No conversation activity | 60 days (zero MAU) | Review with vertical lead; retire if not recoverable |

---

## Registry Maintenance Responsibilities

| Role | Responsibility |
| --- | --- |
| Agent Owner | Keep AgentOwner, Status, SolutionVersion, and knowledge source fields current |
| Vertical Lead | Validate agent entries for their vertical quarterly |
| CoE Admin | Run weekly automated refresh; resolve discrepancies; approve orphan disposition |
| IT Admin | Update environment IDs when environments are provisioned or decommissioned |
| Security Lead | Maintain security fields after each compliance audit |
