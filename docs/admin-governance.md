# Administration and Governance Guide

## Overview
This guide covers tenant administration, security governance, compliance, licensing, and operational management for Copilot Studio agents deployed from this repository.

## Licensing Requirements

### Per-Agent Licensing
| Component | Licence Required | Notes |
|---|---|---|
| Copilot Studio | Copilot Studio per-user or per-tenant | Required for authoring and hosting |
| Power Automate | Power Automate Premium per-user | Required for cloud flows with premium connectors |
| Power BI Premium/Fabric | Power BI Premium per capacity or Fabric | Required for Clothing vertical (DAX query API) |
| AI Builder | AI Builder add-on credits | Required for Insurance OCR, Clothing forecasting |
| Azure AD B2C | Azure AD B2C pricing (per-authentication) | Required for Insurance and Tech external channels |
| Dataverse | Included with Copilot Studio | Additional storage capacity may be required |
| Custom connectors | Included with Power Automate Premium | No additional cost |

### Capacity Planning
- Conversation volume estimation per vertical.
- Dataverse storage: 1 GB base + estimated growth per vertical.
- Power Automate flow runs: estimate based on conversation volume x flows per conversation.
- AI Builder credits: estimate based on document processing volume.

## Environment Management

### Environment Strategy
- Development: one per developer or per vertical, sandbox type.
- Test/UAT: shared test environment, sandbox type.
- Production: dedicated production environment, production type.
- Naming convention: `<org>-<vertical>-<stage>` (for example, `contoso-coffee-prod`).

### Environment Security
- Restrict environment creation to IT admins only (Power Platform Admin Center > Governance).
- Assign security roles:
  - System Administrator (IT)
  - Environment Maker (authors)
  - Basic User (testers)
- Configure data loss prevention (DLP) policies per environment.

## Data Loss Prevention (DLP) Policies

### Agent-Specific DLP Configuration
- Business data group: Dataverse, SharePoint, Office 365 Outlook, Microsoft Teams, Power BI.
- Non-business data group: HTTP, custom connectors (fuel card, telematics, Salesforce).
- Blocked group: social media connectors, personal email connectors.
- Policy scope: apply per-environment or tenant-wide.
- Exception handling: custom connectors require explicit DLP group assignment.

### DLP Best Practices for Agents
- Never allow HTTP connector in the same group as Dataverse (prevents data exfiltration).
- Create separate DLP policies for environments with external-facing agents.
- Audit DLP violations monthly via Power Platform Admin Center reports.

## Usage Analytics and Monitoring

### Copilot Studio Analytics
- Built-in analytics dashboard: Sessions, Engagement Rate, Resolution Rate, Escalation Rate, CSAT.
- Key metrics to monitor per vertical:
  - Coffee: topic usage distribution, shift handover completion rate.
  - Clothing: average query complexity (number of sub-queries), response accuracy.
  - Insurance: FNOL completion rate, escalation rate, fraud flag rate.
  - Tech: lead qualification conversion rate, Salesforce sync success rate.
  - Transportation: anomaly detection accuracy (true positive rate), transaction ingestion lag.

### Power Platform Admin Center
- Capacity usage: Dataverse storage, API request limits, AI Builder credits.
- Connector usage: calls per connector per day.
- Flow success/failure rates.
- User adoption: active users per agent per week.

### Custom Monitoring (Recommended)
- Power Automate flow that writes key agent metrics to a Dataverse `MonitoringMetrics` table daily.
- Power BI dashboard consuming the metrics table for executive reporting.
- Alert rules:
  - Flow failure rate > 5%
  - Escalation rate > 30%
  - Unrecognized input rate > 20%

## Conversation Transcript Management

### Retention Policies
- Default: Copilot Studio retains transcripts for 30 days.
- Extended retention: export transcripts to Dataverse or Azure Blob Storage via Power Automate.
- Per-vertical retention requirements:
  - Insurance: 7 years (regulatory requirement for claims documentation).
  - Tech: 90 days (sales interaction records).
  - Coffee/Clothing/Transportation: 30 days (default).

### Transcript Export Flow
- Scheduled Power Automate flow that exports conversation transcripts.
- Storage: Dataverse table or Azure Blob Storage (for long-term, cost-effective storage).
- Schema: session ID, timestamp, channel, user identity (hashed for privacy), messages, topic, outcome.

## GDPR and Privacy Compliance

### Data Subject Rights
- Right to access: provide conversation history on request (query transcript store by user identity).
- Right to erasure: delete all conversation data for a specific user.
- Right to portability: export conversation data in machine-readable format (JSON).
- Implementation: Power Automate flows for each right, triggered by IT admin.

### Privacy by Design
- Minimize PII collection: only collect what is necessary for the agent's function.
- Data classification: label conversation data by sensitivity (Internal, Confidential, Restricted).
- Encryption: data at rest (Dataverse encryption), data in transit (TLS 1.2+).
- Cross-border considerations: Dataverse environment region must match data residency requirements.

### Cookie and Consent (External Channels)
- Pre-chat consent collection for external web chat (Insurance, Tech).
- Cookie policy: Copilot Studio web chat uses functional cookies.
- Consent record: store consent timestamp and version in Dataverse.

## Security Hardening

### Agent Security Checklist
- [ ] Authentication enabled (never deploy without auth unless explicitly required).
- [ ] Tenant restriction applied for internal agents.
- [ ] DLP policy assigned to the environment.
- [ ] Service account credentials stored in Key Vault or environment variable (secret).
- [ ] API keys rotated on schedule.
- [ ] External channels have rate limiting enabled.
- [ ] Content safety filters enabled for generative answers.
- [ ] Fallback topic does not expose system information.
- [ ] Conversation logs do not contain unmasked PII.

### Penetration Testing Considerations
- Test for prompt injection: attempt to make the agent reveal system prompt or instructions.
- Test for data leakage: attempt to access data outside the user's authorized scope.
- Test for escalation bypass: attempt to skip authentication or authorization checks.
- Test for rate limit bypass: attempt to overwhelm the agent with rapid requests.

## Audit Logging

### What Is Logged
- Azure AD sign-in logs: all authentication events.
- Power Platform audit logs: solution imports, publishes, configuration changes.
- Copilot Studio conversation logs: messages, topics triggered, outcomes.
- Power Automate flow run history: inputs, outputs, success/failure.
- Dataverse audit: record creates, updates, deletes (enable per-table).

### Audit Log Retention
- Azure AD: 30 days (free tier) or 2 years (Azure AD Premium P2).
- Power Platform: 28 days (export to Log Analytics for longer retention).
- Recommendation: export audit logs to Azure Log Analytics workspace for centralized SIEM integration.

## Cost Management

### Cost Levers
- Copilot Studio licence model (per-user vs per-tenant).
- Power Automate flow run volume (optimize flows to minimize API calls).
- Dataverse storage (archive old data, use Synapse Link for analytics).
- AI Builder credits (batch processing during off-peak).
- Azure AD B2C authentications (minimize unnecessary re-authentications with token caching).

### Cost Monitoring
- Power Platform Admin Center: licence usage, capacity consumption.
- Azure Cost Management: B2C, Key Vault, Blob Storage costs.
- Monthly cost review cadence with IT Finance.
