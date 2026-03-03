# Prospect Web Chat Agent Deployment Runbook

## 1. Purpose

This runbook describes end-to-end deployment, validation, monitoring, escalation, and rollback for the Prospect Web Chat Copilot Studio agent. The agent provides an external-facing web chat channel for prospect engagement with Azure AD B2C authentication, anonymous mode, a pre-chat form, live agent handoff, rate limiting, and GDPR compliance flows.

## 2. Prerequisites

### 2.1 Platform and Licensing

- Copilot Studio license assigned to maker and service accounts.
- Power Automate Premium licensing for Dataverse and HTTP connector usage.
- Dataverse environment with solution management enabled.
- Dynamics 365 Customer Service or Omnichannel license if using the Omnichannel handoff path.

### 2.2 Identity Prerequisites

- Azure AD B2C tenant created and configured for external identities.
- LinkedIn and Google social identity providers registered in the B2C tenant.
- Progressive profiling user flow configured in the B2C tenant.
- Verified external website domain for the web chat embed origin restriction.

### 2.3 Website Prerequisites

- Access to inject a JavaScript snippet into the target website pages.
- Cookie consent management platform (CMP) already deployed on the website, or agreement to use the agent-native consent flow.
- HTTPS enforced on all pages where the chat widget will appear.

## 3. Azure AD B2C Setup

### 3.1 Create B2C Tenant

1. Create a new Azure AD B2C tenant in the Azure portal, or use an existing external-facing B2C tenant.
2. Note the tenant name (for example, `contosoprospects.onmicrosoft.com`) and tenant ID.

### 3.2 Register the Copilot Studio Web Chat Application

1. In the B2C tenant, open App Registrations.
2. Register a new application named `ProspectWebChatApp`.
3. Set the redirect URI to the Copilot Studio web channel OAuth callback URL.
4. Enable implicit grant for ID tokens.
5. Note the Application (client) ID.

### 3.3 Configure Social Identity Providers

#### LinkedIn

1. Register a LinkedIn application at the LinkedIn Developer Portal.
2. Add the B2C redirect URI as an allowed redirect URL in the LinkedIn app.
3. Note the Client ID and Client Secret.
4. In the B2C tenant, add LinkedIn as an identity provider using the Client ID and Secret.

#### Google

1. Register an OAuth 2.0 client in Google Cloud Console.
2. Add the B2C redirect URI as an authorized redirect URI.
3. Note the Client ID and Client Secret.
4. In the B2C tenant, add Google as an identity provider using the Client ID and Secret.

### 3.4 Configure User Flows

1. Create a Sign-up and Sign-in user flow named `B2C_1_ProspectSignUpIn`.
2. Enable LinkedIn and Google as identity providers in the flow.
3. Include the following attributes for collection at sign-up: Given Name, Surname, Job Title, Company Name.
4. Configure progressive profiling: collect Company Name and Job Title on the second interaction if not already collected.
5. Set the token lifetime to 60 minutes with refresh token sliding window of 14 days.

## 4. Solution Import and Environment Variables

### 4.1 Import Package

1. Open the target Power Platform environment.
2. Import the Prospect Web Chat managed or unmanaged solution package.
3. Resolve connection references during import.

### 4.2 Set Environment Variables

Configure the following environment variables immediately after import:

| Variable Name | Example Value | Required |
|---|---|---|
| ProspectWebsiteDomain | `https://www.contoso.com` | Yes |
| B2cTenantId | `contosoprospects.onmicrosoft.com` | Yes |
| B2cClientId | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Yes |
| B2cUserFlowName | `B2C_1_ProspectSignUpIn` | Yes |
| LiveAgentQueueId | Queue ID from Omnichannel or Teams | Yes |
| RateLimitWindowSeconds | `60` | Yes |
| RateLimitMaxMessages | `10` | Yes |
| GdprDataControllerName | `Contoso Ltd` | Yes |
| GdprPrivacyPolicyUrl | `https://www.contoso.com/privacy` | Yes |
| ErasureRequestMailbox | `privacy@contoso.com` | Yes |

### 4.3 Secret Storage

- Store `B2cClientId` in the environment secret store or Key Vault-backed configuration.
- Restrict maker access to environments containing production secrets.

## 5. Web Chat Channel Configuration

### 5.1 Generate Embed Script

1. In Copilot Studio, open the Prospect Web Chat agent.
2. Navigate to Settings > Channels > Custom website.
3. Generate the embed script.
4. Set allowed origins to the value of `ProspectWebsiteDomain`.

### 5.2 Configure Branding

In the Custom website channel settings, configure:

- Company logo URL.
- Primary brand color (hex value).
- Welcome message text (for example, `Hello, welcome to Contoso. How can I help you today?`).
- Chat window title.

### 5.3 Embed on Website

1. Copy the generated JavaScript embed snippet.
2. Paste the snippet into the `<head>` or before the closing `</body>` tag on the target web pages.
3. Confirm the snippet appears only on pages where HTTPS is enforced.

## 6. Rate Limiting and Abuse Prevention

### 6.1 Azure API Management or Azure Front Door Policy

Apply the following throttling rules on the endpoint receiving chat traffic:

- Per-session message rate: maximum 10 messages per 60-second window.
- Per-IP session creation rate: maximum 100 new sessions per hour.
- Return HTTP 429 with Retry-After header when thresholds are exceeded.

### 6.2 Copilot Studio Topic-Level Guard

The Rate Limit Guard topic monitors session message count and invokes an early-exit message if the in-session threshold is approached.

### 6.3 Monitoring

- Configure alerts in Azure Monitor when the 429 rate exceeds 5% of total requests over a 5-minute window.
- Review throttle event logs weekly.

## 7. GDPR and Privacy Compliance Configuration

### 7.1 Cookie Consent

- If the website uses a CMP, ensure the chat widget script is loaded only after consent categories (analytics, functional) are accepted.
- If using the agent-native consent flow, the GDPR Consent topic fires at session start and blocks data collection until the user accepts.

### 7.2 Data Processing Notice

- The GDPR Consent topic presents the data controller name and a link to the privacy policy before collecting any information.
- Consent choice is stored in the `crf_ConsentRecords` Dataverse table with timestamp.

### 7.3 Right to Erasure Flow

- The Right to Erasure topic allows a prospect to submit a deletion request at any time during the session.
- Submission triggers the `SubmitErasureRequest` Power Automate flow, which creates a record in `crf_ErasureRequests` and sends a confirmation email to `ErasureRequestMailbox`.
- Target response time: acknowledgement within 72 hours, completion within 30 days per GDPR Article 17.

## 8. Authentication Setup

### 8.1 Anonymous Mode

- Prospects may start a conversation without signing in.
- Product Q&A, pricing guidance, and general inquiry topics are available without authentication.
- No personal data is stored for anonymous sessions except rate-limit counters (IP only, not name or email).

### 8.2 Progressive Authentication Gate

- When a prospect requests to schedule a meeting or access gated content, the Meeting Schedule Request topic checks `Global.Authenticated`.
- If the prospect is not authenticated, the topic presents a sign-in prompt using the B2C user flow.
- After successful sign-in, the flow resumes from the gated step.

## 9. Validation Checklist

| Check | Expected Result | Status |
|---|---|---|
| Embed script loads on website | Chat widget appears on target pages | Pending |
| Allowed origin enforcement | Widget blocked on non-listed domains | Pending |
| Branding applied | Logo, color, and welcome message visible | Pending |
| GDPR consent topic fires | Consent presented before data collection | Pending |
| Anonymous product Q&A | Response returned without sign-in | Pending |
| Pre-chat form submission | Company, role, and interest captured and topic routed | Pending |
| Meeting schedule auth gate | Sign-in prompt triggered when unauthenticated | Pending |
| B2C LinkedIn sign-in | Social sign-in completes and token received | Pending |
| B2C Google sign-in | Social sign-in completes and token received | Pending |
| Progressive profiling | Company and role collected on second interaction if missing | Pending |
| Live agent handoff | Handoff reaches Omnichannel or Teams queue with transcript | Pending |
| Rate limit enforcement | 429 returned after threshold exceeded | Pending |
| Right to erasure submission | Erasure request logged and confirmation sent | Pending |

## 10. Monitoring Cadence

### 10.1 Daily

- Review failed Power Automate flow runs (lead creation, scheduling, handoff, erasure).
- Review escalation volume and unresolved handoffs.

### 10.2 Weekly

- Review topic trigger distribution and fallback rates.
- Review session-to-lead conversion rate.
- Review rate limit event volume and 429 response rate.
- Review consent acceptance rate and abandonment at consent gate.

### 10.3 Monthly

- Credential and connection health review (B2C app, LinkedIn, Google, flow connectors).
- Knowledge source freshness review.
- GDPR erasure request backlog review.
- Governance and access audit (maker, admin, connection owners).

## 11. Escalation Matrix

| Severity | Example | Owner | Response Target |
|---|---|---|---|
| Sev 1 | Chat widget down or embed script not loading | Platform Operations Lead | 15 minutes |
| Sev 2 | B2C authentication failures or handoff flow broken | Identity and Integration Owner | 1 hour |
| Sev 3 | Topic quality degradation or routing drift | Copilot Studio Product Owner | 1 business day |
| Sev 4 | Content update or branding change request | Marketing and Sales Enablement Owner | 2 business days |

## 12. Rollback Procedure

1. Disable the web chat channel in Copilot Studio to stop new sessions.
2. Revert to the previously exported stable solution version.
3. Restore previous environment variable values if modified.
4. Rebind known-good connection references.
5. Re-enable the channel and regenerate the embed script if needed.
6. Re-inject the updated embed script into the website.
7. Execute smoke tests:
   - GDPR consent at session start.
   - Anonymous product Q&A response.
   - Pre-chat form capture.
   - Meeting schedule auth gate.
   - Live agent handoff.
8. Notify stakeholders and document incident root cause analysis.

## 13. Post-Deployment Handover

- Provide runbook and support ownership contacts.
- Store latest solution export and configuration snapshot in the release repository.
- Confirm monitoring dashboards, alert routing, and GDPR erasure request mailbox are active.
- Brief website team on embed script injection and update process.
