# Authentication Architecture

## Overview
Copilot Studio agents support multiple authentication models depending on channel, audience, data sensitivity, and downstream system integration requirements. This guide documents production authentication patterns for the five verticals:

- Coffee
- Clothing
- Tech
- Transportation
- Insurance

The architecture assumes Zero Trust identity principles:

1. Verify explicitly.
2. Use least privilege.
3. Assume breach.

## Authentication Models Summary

| Authentication model | When to use | Verticals using it | Complexity |
|---|---|---|---|
| Azure AD (Microsoft Entra ID) | Internal employees, corporate-managed identities, Teams-first experiences | Coffee, Clothing, Tech (internal), Transportation, Insurance (internal) | Medium |
| Azure AD B2C (External Identities) | External customers and prospects not present in internal tenant | Insurance (policyholders), Tech (website prospects) | High |
| Salesforce SSO Federation | Internal users requiring delegated access to Salesforce data through agent workflows | Tech | High |
| Service Account Authentication | Scheduled flows, batch jobs, non-interactive integrations | Coffee, Clothing, Insurance, Tech, Transportation | Medium |
| API Key Authentication (Custom Connectors) | Third-party APIs that support key-based authentication only | Transportation, Insurance | Low to Medium |
| RLS Pass-Through (Power BI/Dataverse/SharePoint) | Enforcing data-level authorization based on authenticated user identity | Clothing, Coffee, all role-aware internal workloads | High |

## Azure AD (Internal Employees)

### Used by
- Coffee
- Clothing
- Tech (internal users)
- Transportation
- Insurance (internal operations)

### Configuration Path in Copilot Studio
`Settings > Security > Authentication > Authenticate with Microsoft`

### Tenant Restriction
Restrict sign-in to your organization tenant only. Do not allow common or consumer endpoints for internal agents.

Recommended authority pattern:

```text
https://login.microsoftonline.com/<tenant-id-or-verified-domain>
```

### How It Works
1. User opens agent in Microsoft Teams or web chat.
2. If in Teams, SSO bootstraps Entra identity context automatically when correctly configured.
3. If in web chat, user is redirected to Microsoft login.
4. Copilot Studio receives token and establishes authenticated session.
5. Identity context is passed to Power Automate actions and connectors.

### Claims Available to Agent
Typical claims include:

- `name` (display name)
- `preferred_username` or `upn`
- `email`
- `oid` (object ID)
- `tid` (tenant ID)
- `groups` (group membership, when configured and within token limits)

### Row-Level Security Flow
Identity can be propagated through Power Automate into downstream systems:

1. Agent receives authenticated Entra user.
2. Flow captures identity fields (UPN, object ID, group IDs).
3. Flow invokes Power BI with user context for RLS-scoped dataset queries.
4. Flow invokes Dataverse where security roles and ownership enforce row-level access.
5. Response returned with filtered data only.

### Step-by-Step Setup (UI Path Description)
1. Open Copilot Studio and select the target agent.
2. Go to **Settings** in left navigation.
3. Open **Security**.
4. Select **Authentication**.
5. Choose **Authenticate with Microsoft**.
6. Set tenant restriction to your organization tenant ID.
7. Save and publish to a test environment.
8. Validate in Teams with a pilot user and in web chat with a browser session.
9. Confirm sign-in logs in Entra and verify denied access for out-of-tenant accounts.

## Azure AD B2C (External Customers/Prospects)

### Used by
- Insurance (policyholders)
- Tech (website prospects)

### When to Use
Use B2C when user population is external and unmanaged by internal Entra tenant.

### B2C Tenant Setup
Configure:
- User flows: sign-up/sign-in, profile edit, password reset
- Identity providers: local email plus social providers such as LinkedIn and Google
- Branding: custom pages, logos, policy-specific UX text

### Progressive Profiling Pattern
Recommended pattern:
1. Allow anonymous discovery and basic Q and A.
2. Gate sensitive or high-value actions (for example, claim check, meeting booking).
3. Prompt for registration/sign-in at gate.
4. Continue session with enriched profile claims.

### Custom Policies
For sensitive operations:
- Require MFA during claim submission or PII updates.
- Apply custom claims transformations.
- Use policy-specific content definitions and localization.

### Token Claims Mapping to Agent Context
Map B2C attributes into variables:
- `givenName`
- `surname`
- `emails`
- `extension_<appId>_customerId` (custom extension attribute)
- `newUser` (first-time registration indicator if configured)

### Integration with Copilot Studio
In agent authentication settings, configure B2C as identity provider with tenant and policy endpoints. Ensure reply URLs match published channel endpoints.

### Step-by-Step Setup
1. Create or select B2C tenant.
2. Register app for Copilot Studio channel callback URLs.
3. Configure user flow `B2C_1_signupsignin`.
4. Add identity providers (email, LinkedIn, Google).
5. Configure token claims in user flow output.
6. In Copilot Studio: **Settings > Security > Authentication**.
7. Select external identity provider configuration and enter B2C authority.
8. Set client ID and policy path.
9. Save, publish, and validate:
   - Sign-up flow
   - Sign-in flow
   - Claim mapping in test topic/flow

Example B2C metadata reference:

```yaml
b2c:
  tenant: contosoexternal.onmicrosoft.com
  policy: B2C_1_signupsignin
  authority: https://contosoexternal.b2clogin.com/contosoexternal.onmicrosoft.com/B2C_1_signupsignin/v2.0
  clientId: 00000000-0000-0000-0000-000000000000
```

## Salesforce SSO Federation (Tech Vertical)

### Scenario
Sales reps authenticate with Azure AD and need seamless access to Salesforce-backed data in agent responses without separate interactive login prompts.

### Federation Options
- SAML 2.0 federation between Azure AD and Salesforce
- OIDC federation with Salesforce Connected App

### Salesforce Connected App Requirements
Configure:
- Callback URLs matching integration flow endpoints
- OAuth scopes (minimum required)
- Token policies and session timeout
- Permitted users and profile mappings

Example minimal OAuth scope set:

```json
{
  "scopes": [
    "api",
    "refresh_token",
    "openid"
  ]
}
```

### Delegated Token Flow
1. User signs in to agent via Azure AD.
2. Power Automate flow receives user identity context.
3. Federation trust exchanges identity for Salesforce delegated token.
4. Flow queries Salesforce with user-context token.
5. Data returned according to user permissions in Salesforce.

### Service Account Fallback
Use fallback only when delegated token is unavailable (for example, scheduled jobs). Scope fallback account to least privilege and restrict to non-user-specific operations.

### Token Refresh and Session Timeout
- Store refresh tokens in approved secret store only.
- Enforce explicit refresh before expiry.
- Handle `401/invalid_token` with retry-once plus re-auth trigger for interactive sessions.
- Keep Salesforce session timeout aligned with internal security policy.

## Service Account Authentication (Power Automate Flows)

### When to Use
- Scheduled flows
- Batch operations
- System-to-system integrations without user interaction

### Pattern
Use dedicated non-human account per integration boundary. Do not use personal accounts.

### Credential Storage
Preferred:
1. Azure Key Vault with managed access policies.
2. Power Platform environment variables (Secret type) when Key Vault integration is not feasible.

### Rotation Policy
- Rotate every 90 days minimum.
- Automate rotation where possible.
- Validate dependent connectors after rotation.

Example PowerShell rotation sketch:

```powershell
# Rotate secret in Entra app registration
$appObjectId = "<app-object-id>"
$newSecret = Add-MgApplicationPassword -ApplicationId $appObjectId -PasswordCredential @{
  displayName = "automation-rotated"
  endDateTime = (Get-Date).AddDays(90)
}

# Persist to Key Vault
Set-AzKeyVaultSecret -VaultName "<kv-name>" -Name "service-account-secret" -SecretValue (ConvertTo-SecureString $newSecret.SecretText -AsPlainText -Force)
```

### Required Service Account Usage by Vertical
- Coffee: SharePoint content sync, approval notifications
- Clothing: POS and ERP sync, anomaly detection scheduled flow
- Insurance: SLA monitoring, CAT mode activation
- Tech: Salesforce batch sync, pipeline analytics
- Transportation: fuel transaction ingestion, anomaly detection

## API Key Authentication (Custom Connectors)

### Used by
- Transportation: fuel card API, telematics, fuel price, mapping APIs
- Insurance: claims management API

### Pattern
Pass API key in:
- Request header (preferred)
- Query parameter (only when required by provider)

### Storage
- Environment variable (Secret)
- Azure Key Vault reference

### Custom Connector Security Scheme
Define key auth in OpenAPI:

```json
{
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      }
    }
  },
  "security": [
    { "ApiKeyAuth": [] }
  ]
}
```

### Rotation and Monitoring
- Rotate keys on fixed schedule or provider-triggered events.
- Monitor failure rate spikes indicating expired or revoked keys.
- Alert on unauthorized endpoint usage or unexpected geolocation patterns.

## Row-Level Security (RLS) Pass-Through

### Power BI RLS (Clothing)
Authenticated user identity must flow from agent to Power Automate to Power BI semantic model. RLS role rules enforce store-level data isolation.

### Dataverse Security Roles
Use business unit, team, and ownership scopes to limit row access:
- User-owned rows
- Business unit rows
- Parent-child business unit rows

### SharePoint Permissions (Coffee)
Agent interactions that retrieve documents must respect SharePoint ACLs for authenticated user identity. Avoid broad service-account reads for user-specific content retrieval.

## Channel-Specific Authentication

| Channel | Auth pattern |
|---|---|
| Microsoft Teams | Automatic SSO via Azure AD |
| Web chat (internal) | Azure AD redirect and tenant-restricted sign-in |
| Web chat (external) | Azure AD B2C or anonymous discovery mode |
| Mobile web | Same as web chat with responsive sign-in UX |
| Power Apps | Inherits Power Apps authenticated context |

## Security Hardening

### Conditional Access
- Require MFA for agent access from unmanaged devices.
- Enforce compliant device or app protection where applicable.
- Exclude only documented emergency accounts.

### Token Lifetime
Default access token lifetime is commonly one hour. Keep short-lived access tokens and rely on secure refresh mechanisms.

### Session Management
Define idle timeout and absolute timeout. Force re-authentication after session expiration or risk events.

### IP Restrictions
For internal-only agents, restrict access to trusted corporate ranges or compliant network locations.

### DLP Policies
Use Power Platform DLP to restrict connector combinations and prevent exfiltration to non-approved services.

Example Conditional Access policy payload (illustrative):

```json
{
  "displayName": "Require MFA for Copilot Studio Internal Agent",
  "state": "enabled",
  "conditions": {
    "users": { "includeGroups": ["<internal-agent-users-group-id>"] },
    "applications": { "includeApplications": ["<copilot-studio-app-id>"] },
    "clientAppTypes": ["browser", "mobileAppsAndDesktopClients"]
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": ["mfa"]
  }
}
```

## Compliance and Audit

### Authentication Event Logging
- Azure AD sign-in logs for internal authentication
- B2C audit and sign-in logs for external identities
- Connector and flow run logs for downstream access evidence

### Conversation Transcript Retention
Set retention by environment based on legal and regulatory requirements. Separate production and non-production retention rules.

### GDPR
Implement right-to-erasure workflows for B2C customer data, including conversation artifacts and related profile data in integrated systems.

### SOC 2 and ISO 27001
Leverage Copilot Studio and Power Platform compliance controls with tenant-level security baselines:
- Access control
- Audit trails
- Change management
- Incident response

## Implementation Checklist

| Control area | Requirement | Status owner |
|---|---|---|
| Identity provider | Azure AD or B2C configured per vertical | Identity team |
| Token claims mapping | Required claims mapped into agent and flow context | Agent engineering |
| Least privilege | Service accounts and app permissions minimized | Security architecture |
| Secret management | Key Vault or environment secret configured | Platform engineering |
| Rotation | 90-day credential/key rotation automated | Operations |
| RLS validation | Power BI/Dataverse/SharePoint access tests passed | Data platform |
| CA and MFA | Conditional Access policies enforced | IAM team |
| Logging and audit | Sign-in and flow logs retained and reviewed | Compliance |

