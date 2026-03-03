# Salesforce SSO and Identity Federation -- Seller Prospect Agent

## Overview

This document describes the full identity federation architecture between Microsoft Entra ID (Azure AD), Azure AD B2C, and Salesforce CRM for the Seller Prospect agent. It covers five implementation areas:

1. Azure AD to Salesforce SSO (SAML 2.0 or OIDC)
2. Token management and delegated identity in Power Automate
3. Service account fallback for scheduled and batch operations
4. External user identity mapping (B2C to Salesforce lead)
5. Session management and token lifecycle

---

## 1. Azure AD to Salesforce SSO

### Federation Options

Two federation protocols are supported. Choose based on your Salesforce org configuration and enterprise standards.

| Protocol | When to use |
|---|---|
| SAML 2.0 | Existing SAML-based federation infrastructure, Salesforce SP-initiated SSO required |
| OIDC (Connected App) | Simpler token exchange, token introspection, OpenID Connect already in use |

### 1.1 SAML 2.0 Federation

#### Azure AD Configuration

1. In Entra ID, open **Enterprise Applications** and create a new app or use the existing Salesforce gallery app.
2. Under **Single Sign-On**, select **SAML**.
3. Set the following values:

| Field | Value |
|---|---|
| Identifier (Entity ID) | `https://your-instance.my.salesforce.com` |
| Reply URL (ACS) | `https://your-instance.my.salesforce.com` |
| Sign on URL | `https://your-instance.my.salesforce.com` |
| Relay State | (optional, Salesforce-specific) |

4. Under **Attributes and Claims**, map:
   - `emailaddress` to `user.mail`
   - `givenname` to `user.givenname`
   - `surname` to `user.surname`
   - `Unique User Identifier` to `user.userprincipalname`
5. Download the Federation Metadata XML. You will upload this to Salesforce in the next step.

#### Salesforce Configuration

1. In Salesforce Setup, navigate to **Identity Provider** and enable the Salesforce identity provider if you are using Salesforce as an SP only.
2. Go to **Single Sign-On Settings** and create a new SAML SSO configuration.
3. Upload the Azure AD Federation Metadata XML.
4. Set **Federation ID** to map to the user email or UPN attribute from the SAML assertion.
5. Under user profile settings, map Salesforce profiles to Azure AD group claims.
6. Enable SSO in the Salesforce login page settings for your domain.

#### Attribute Mapping Reference

```yaml
samlAttributeMapping:
  emailAddress: user.mail
  salesforceFederationId: user.userprincipalname
  givenName: user.givenname
  surname: user.surname
  department: user.department
  jobTitle: user.jobtitle
```

### 1.2 OIDC Federation

1. In Salesforce, create a new **Connected App** with OAuth 2.0 settings.
2. Enable **OpenID Connect** scope in the Connected App.
3. Set the callback URL to the Power Platform OAuth callback URL.
4. Required OAuth scopes:

```yaml
oauthScopes:
  - api
  - refresh_token
  - openid
  - profile
  - email
```

5. In Azure AD, register an app and configure it to request delegated permissions against the Salesforce Connected App.
6. Configure the **on_behalf_of** (OBO) grant if your architecture uses delegated identity from the agent through Power Automate to Salesforce.

---

## 2. Token Management and Delegated Identity

### Architecture

Sales reps authenticate once with Azure AD via Copilot Studio. The authenticated Entra identity is passed to Power Automate flows, which exchange it for a Salesforce user-context token. All Salesforce API calls in the flow run under the authenticated user identity, ensuring Salesforce profiles and sharing rules are respected.

```text
[Sales Rep] --> [Copilot Studio / Teams SSO] --> [Entra ID Token]
      |
      v
[Power Automate flow receives User.Id and User.Email]
      |
      v
[GetDelegatedSalesforceToken flow]
      |  (OBO exchange or SAML assertion grant)
      v
[Salesforce API -- user-context token]
      |
      v
[Data returned according to rep's Salesforce profile and sharing rules]
```

### GetDelegatedSalesforceToken Flow

This flow exchanges the Entra user identity for a Salesforce delegated access token using the JWT Bearer Token grant or the SAML Assertion grant.

**Inputs:**
- `userEmail` -- authenticated user's email from Entra claims
- `userUpn` -- user principal name from Entra token

**Outputs:**
- `salesforceAccessToken` -- scoped to authenticated user
- `tokenExpiresAt` -- UTC datetime of token expiry

**Implementation steps:**
1. Receive the Entra user identity from the triggering agent via the flow inputs.
2. Construct a signed JWT assertion using the Salesforce Connected App private key.
3. POST to the Salesforce token endpoint:

```text
POST https://your-instance.my.salesforce.com/services/oauth2/token
grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
assertion=<signed-jwt>
```

4. Parse the access token and expiry from the response.
5. Store token in the flow run context for downstream Salesforce connector actions.
6. Return token metadata to calling agent.

### Token Storage Policy

- Access tokens are not persisted to Dataverse or environment variables.
- Tokens are held only in Power Automate flow run memory for the duration of a single conversation turn.
- Refresh tokens are stored in environment secret variables or Azure Key Vault only (never in flow variables or conversation context).

### How Salesforce API Calls Use Delegated Token

Each Salesforce-connected flow action that requires user context:

1. Calls `GetDelegatedSalesforceToken` at the start of the flow run.
2. Passes the returned access token as a bearer token in HTTP connector actions when the prebuilt Salesforce connector does not natively support user impersonation.
3. Falls back to service account token if delegated exchange fails and the operation is non-user-specific.

---

## 3. Service Account Fallback

### When to Use Service Account

| Scenario | Token type |
|---|---|
| Scheduled pipeline batch export | Service account |
| Overnight opportunity data refresh | Service account |
| Batch BANT score sync to Salesforce | Service account |
| Interactive rep request (pipeline lookup) | Delegated user token |
| Interactive rep request (lead create) | Delegated user token |
| External prospect lead creation (B2C user) | Service account (B2C is not Salesforce identity) |

### Salesforce Integration User Setup

1. In Salesforce, create a dedicated integration user: `copilot-integration@your-company.com`.
2. Assign a profile or permission set that includes:
   - API access enabled
   - Read access to Opportunity, Account, Contact, Lead, Task
   - Create and edit access to Lead, Task, Activity
   - No access to sensitive objects outside the above scope
3. Enable **API Only** login restriction for this user to prevent interactive console sign-in.
4. Assign the user to a permission set that explicitly lists permitted connected apps.

### Service Account Credential Storage

```yaml
serviceAccountCredentials:
  salesforceUsername:
    envVariableName: SalesforceServiceAccountUsername
    type: string
    secret: false
  salesforcePassword:
    envVariableName: SalesforceServiceAccountPassword
    type: secret
    vaultBacked: true
  salesforceSecurityToken:
    envVariableName: SalesforceServiceAccountToken
    type: secret
    vaultBacked: true
```

### GetServiceAccountSalesforceToken Flow

This flow performs a Username/Password OAuth grant using the service account credentials for non-interactive operations.

**Inputs:** none (reads credentials from environment variables)

**Outputs:**
- `serviceAccountAccessToken`
- `tokenExpiresAt`

**Token rotation:** Service account password and security token must be rotated every 90 days. After rotation, update the corresponding environment variables and validate scheduled flows.

---

## 4. External User Identity Mapping (B2C to Salesforce)

### Scenario

Website prospects authenticate via Azure AD B2C during or after a qualification conversation. Once authenticated, the B2C identity must be linked to the Salesforce Lead record that was created during their anonymous or post-qualification interaction.

### Identity Linking Flow

```text
[Prospect -- anonymous web chat]
      |
      v
[Lead Qualification topic -- BANT collected]
      |
      v
[CreateSalesforceLead flow -- lead created with B2C session correlation ID]
      |
      v
[Prospect authenticates via B2C gate]
      |
      v
[MapB2CIdentityToSalesforceLead flow]
      |  inputs: b2cObjectId, prospectEmail, salesforceLeadId
      v
[Salesforce Lead -- B2C_Object_Id__c field updated]
      |
      v
[Dataverse ProspectInteractions -- b2cObjectId linked to record]
```

### MapB2CIdentityToSalesforceLead Flow

**Inputs:**
- `b2cObjectId` -- Azure AD B2C object ID from claims after sign-in
- `prospectEmail` -- email address for correlation lookup
- `salesforceLeadId` -- Salesforce Lead record ID from earlier creation

**Outputs:**
- `mappingStatus` -- success or failure indicator
- `salesforceLeadId` -- confirmed or updated lead ID

**Steps:**
1. Look up the Salesforce Lead by `prospectEmail` if `salesforceLeadId` is not available.
2. Update the Lead record custom field `B2C_Object_Id__c` with the `b2cObjectId` value.
3. Update the `crf_ProspectInteractions` Dataverse record to include the `b2cObjectId`.
4. Return mapping confirmation.

### Salesforce Lead Custom Field

Add the following custom field to the Salesforce Lead object:

| Field label | API name | Type | Description |
|---|---|---|---|
| B2C Object ID | B2C_Object_Id__c | Text(255) | Azure AD B2C object ID for external prospect identity federation |

### Agent-Side Identity Mapping Topic

The agent triggers identity mapping when a B2C-authenticated prospect has an existing anonymous interaction or lead record:

```text
[After B2C sign-in event]
  --> Check Global.SalesforceLeadId is set
  --> If set: invoke MapB2CIdentityToSalesforceLead
  --> If not set: run standard CreateSalesforceLead with B2C identity fields
```

---

## 5. Session Management

### Token Lifetime Policy

| Token type | Lifetime | Refresh strategy |
|---|---|---|
| Entra ID access token | 1 hour (default) | Silent MSAL refresh in Copilot Studio |
| Entra ID refresh token | 90 days (default, conditional access configurable) | Automatic |
| Salesforce delegated access token | Configured in Salesforce session settings | Re-exchange via GetDelegatedSalesforceToken |
| Salesforce service account token | Follows Salesforce session policy | Re-obtain via GetServiceAccountSalesforceToken |
| B2C access token | Configured in user flow settings | Silent refresh or prompt |

### Salesforce Session Settings

Configure the following in Salesforce Setup under **Session Settings**:

| Setting | Recommended value | Notes |
|---|---|---|
| Session timeout | 2 hours | Align with enterprise security policy |
| Lock sessions to IP address | Disabled for Power Platform flows | Power Platform uses dynamic IP ranges |
| Lock sessions to domain | Enabled | Restrict to your Salesforce domain |
| Require secure connections (HTTPS) | Enabled | Required |
| Enable caching and autocomplete on login page | Disabled | Security hardening |

### Token Refresh in Power Automate

All flows that call Salesforce must handle token expiry:

1. Attempt Salesforce API call with current token.
2. On `401 Unauthorized` response:
   a. Re-invoke token acquisition flow (`GetDelegatedSalesforceToken` or `GetServiceAccountSalesforceToken`).
   b. Retry the API call once with the refreshed token.
   c. If retry fails, return error status to agent.
3. On second failure, agent surfaces user-facing error and logs the failure event.

### Agent Session Timeout Behavior

| Event | Agent behavior |
|---|---|
| Entra token expires mid-conversation (Teams) | Silent MSAL refresh; user is not interrupted |
| Salesforce token expires mid-flow | Flow retries with refreshed token |
| B2C token expires (web chat) | Agent prompts for re-authentication if action requires identity |
| Copilot Studio session idle timeout | Conversation context cleared; user greeted as new session |

### Idle Timeout Configuration

Configure idle session timeout per channel in Copilot Studio:

- Teams channel: align with Teams client session policy (typically 8 hours)
- Web chat: configure channel-level idle timeout to 30 minutes for external prospects

---

## Validation Checklist

| Component | Check | Expected result |
|---|---|---|
| Azure AD to Salesforce SSO | SAML assertion or OIDC token exchange | Salesforce login via Entra without password prompt |
| Delegated token flow | GetDelegatedSalesforceToken output | Valid Salesforce access token scoped to user identity |
| Salesforce data access | Opportunity lookup with delegated token | Only records visible to rep are returned |
| Service account fallback | Scheduled batch flow run | Completes using service account token, no interactive prompt |
| B2C identity mapping | MapB2CIdentityToSalesforceLead | Lead record updated with B2C object ID |
| Token refresh | Expire token then invoke flow | Flow retries and succeeds with refreshed token |
| Session timeout | Idle web chat session beyond 30 minutes | New session initiated on next message |
| Credential rotation | Rotate service account password | Flows resume successfully after environment variable update |

---

## Security Considerations

- All tokens are short-lived and not stored in conversation or topic variables.
- Service account credentials are stored only in environment secret variables or Key Vault-backed references.
- The Salesforce integration user is configured with API-only login and least-privilege permission sets.
- B2C identity mapping uses object IDs (not email alone) to prevent enumeration and account takeover vectors.
- Conditional Access policies in Entra require MFA for agent access from unmanaged devices.
- All Salesforce API traffic uses HTTPS. No plain HTTP calls are permitted.
- Client secrets and security tokens rotate every 90 days.
