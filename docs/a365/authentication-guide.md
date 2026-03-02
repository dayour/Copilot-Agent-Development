# M365 Agents SDK Authentication Guide

## Overview

This guide covers the authentication requirements for integrating Microsoft 365 Agents SDK-based applications with Copilot Studio agents. It includes app registration requirements, OAuth scope selection for Microsoft Graph access, the token exchange flow for Single Sign-On in Teams, and service-to-service authentication for backend agents.

## App Registration Requirements

### Registration Overview

Every application or agent that communicates with Copilot Studio or with another SDK-based agent requires an app registration in Microsoft Entra ID. The registration establishes the application identity used to acquire tokens.

### Step-by-Step: Create an App Registration

1. Open the Azure portal and navigate to Microsoft Entra ID.
2. Select **App registrations** and then **New registration**.
3. Enter a display name (for example, `contoso-claims-agent`).
4. Set **Supported account types** to **Single tenant** for internal-only agents or **Multitenant** only when required.
5. Leave the redirect URI blank for daemon/service applications. For user-facing web applications, set the redirect URI to the application callback URL.
6. Click **Register**.
7. Note the **Application (client) ID** and **Directory (tenant) ID** from the registration overview.
8. Under **Certificates and secrets**, create either a client secret or upload a certificate (preferred for production).
9. Under **API permissions**, configure the required delegated or application permissions.
10. Under **Expose an API**, define the application ID URI and any scopes required for downstream agents to call this application.

### aad.manifest.json for Automated Registration

For repeatable deployments, define the app registration in an AAD manifest file:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "appId": "00000000-0000-0000-0000-000000000001",
  "displayName": "contoso-claims-agent",
  "signInAudience": "AzureADMyOrg",
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        { "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d", "type": "Scope" },
        { "id": "570282fd-fa5c-430d-a7fd-fc8dc98a9dca", "type": "Scope" },
        { "id": "ff74d97f-43af-4b68-9f2a-b232e6b0c0eb", "type": "Scope" }
      ]
    },
    {
      "resourceAppId": "bf3796f3-d91f-4104-8ab0-9ba0a5c3f1d3",
      "resourceAccess": [
        { "id": "d8c0d6a7-2d4e-4e3b-a0b5-6f7c8e9d0f1a", "type": "Scope" }
      ]
    }
  ],
  "oauth2Permissions": [
    {
      "adminConsentDescription": "Allow the application to send messages to the agent on behalf of the signed-in user.",
      "adminConsentDisplayName": "Access Claims Agent",
      "id": "00000000-0000-0000-0000-000000000002",
      "isEnabled": true,
      "type": "User",
      "userConsentDescription": "Allow this application to access the Claims Agent on your behalf.",
      "userConsentDisplayName": "Access Claims Agent",
      "value": "agent.access"
    }
  ],
  "keyCredentials": [],
  "passwordCredentials": []
}
```

Apply the manifest using the Microsoft Graph API or the Azure CLI:

```bash
az ad app update --id {appId} --set requiredResourceAccess=@aad.manifest.json
```

### Required API Permissions by Integration Pattern

| Integration pattern | Required permissions | Permission type |
|---|---|---|
| Teams AI + Copilot Studio (delegated user) | `User.Read`, `Chat.ReadWrite` | Delegated |
| Service-to-service backend agent | Bot Service `/.default` scope | Application |
| M365 Copilot Extension (OBO) | `User.Read`, extension-specific scopes | Delegated |
| Direct Line custom client | Direct Line token endpoint access | Application |

---

## OAuth Scopes for Microsoft Graph Access

### Calendar Access

Use the following scopes when the agent reads or creates calendar events on behalf of users:

| Scope | Permission type | Use case |
|---|---|---|
| `Calendars.Read` | Delegated | Read user calendar events |
| `Calendars.ReadWrite` | Delegated | Create or update calendar events |
| `Calendars.Read.Shared` | Delegated | Read shared calendars |
| `Calendars.ReadBasic` | Delegated | Read free/busy and basic event metadata only |

Prefer `Calendars.ReadBasic` when only availability information is needed. This reduces the consent scope shown to users and limits data exposure.

### Mail Access

| Scope | Permission type | Use case |
|---|---|---|
| `Mail.Read` | Delegated | Read user inbox and messages |
| `Mail.Send` | Delegated | Send mail on behalf of the user |
| `Mail.ReadWrite` | Delegated | Read and update mail, move messages |
| `MailboxSettings.Read` | Delegated | Read timezone and locale settings for scheduling |

For notification-only flows where the agent sends confirmation emails, `Mail.Send` is sufficient. Do not request `Mail.ReadWrite` unless inbox management is required.

### Files Access (SharePoint and OneDrive)

| Scope | Permission type | Use case |
|---|---|---|
| `Files.Read` | Delegated | Read user's OneDrive files |
| `Files.ReadWrite` | Delegated | Create or modify files in OneDrive |
| `Files.Read.All` | Delegated | Read all accessible files including SharePoint document libraries |
| `Sites.Read.All` | Delegated | Read content from SharePoint sites |

Use `Sites.Read.All` for agents that retrieve documents from SharePoint knowledge sources to ensure consistent access regardless of library nesting.

### User Profile Access

| Scope | Permission type | Use case |
|---|---|---|
| `User.Read` | Delegated | Read the signed-in user's profile |
| `User.ReadBasic.All` | Delegated | Look up other users' display names and email addresses |
| `profile` | Delegated | OpenID Connect profile claim (included in most flows automatically) |

### Requesting Admin Consent

Delegated permissions that access organizational data (for example, `Mail.ReadWrite`, `Sites.Read.All`, `Calendars.ReadWrite`) require admin consent before users can grant them. To initiate admin consent:

1. Construct the admin consent URL:

```text
https://login.microsoftonline.com/{tenantId}/adminconsent
  ?client_id={appId}
  &redirect_uri={callbackUrl}
```

2. A tenant administrator opens the URL and approves the requested permissions.
3. After consent, users in the tenant can acquire tokens with those scopes without individual prompts.

---

## Token Exchange Flow for SSO in Teams

### Overview

When a Teams AI application or Copilot Studio agent is deployed in Teams, Single Sign-On (SSO) allows the agent to obtain an access token for Microsoft Graph on behalf of the signed-in Teams user without displaying a login prompt. The SSO flow relies on the Teams client exchanging the user's Teams identity for an Entra ID token.

### Prerequisites

- The app registration must expose an API with an Application ID URI in the format `api://fully-qualified-domain/{appId}` or `api://{appId}`.
- The Teams app manifest must include the `webApplicationInfo` section referencing the app registration.
- The `access_as_user` scope must be defined in the app registration's **Expose an API** section.
- Admin consent must be granted for the required Graph scopes.

### Teams App Manifest Configuration

```json
{
  "webApplicationInfo": {
    "id": "{appId}",
    "resource": "api://{appId}"
  }
}
```

### SSO Flow Sequence

```
Teams Client (User)
    |
    | Teams.getAuthToken() -- requests SSO token from Teams
    v
Teams Client SDK
    |
    | Acquires Teams SSO token (audience: api://{appId})
    v
Bot Framework (in-turn activity)
    |
    | Activity includes Teams SSO token in channelData
    v
Teams AI Application / Agent
    |
    | OBO flow: exchange Teams SSO token for Graph token
    | POST /oauth2/v2.0/token
    |   grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
    |   assertion={TeamsSSOToken}
    |   requested_token_use=on_behalf_of
    |   scope=Calendars.Read Mail.Read Files.Read.All
    v
Microsoft Entra ID
    |
    | Issues delegated Graph token (user context preserved)
    v
Microsoft Graph API
    |
    | Returns user-scoped data
    v
Agent processes result and replies to user
```

### OBO Token Exchange Request

```text
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&client_id={appId}
&client_secret={appSecret}
&assertion={inboundToken}
&requested_token_use=on_behalf_of
&scope=https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Mail.Read offline_access
```

### Handling Token Exchange Failures

If the OBO exchange fails because consent has not been granted, the agent must trigger an explicit sign-in card:

1. Catch the `OAuthError` with `error: interaction_required`.
2. Send an `OAuthCard` or `SignIn` card to the user.
3. After the user completes sign-in, the Teams client sends a token response activity.
4. Extract the token from the activity and retry the downstream Graph call.

Always implement this fallback path. SSO is not guaranteed on all Teams clients or configurations.

### Token Caching

Cache acquired tokens using MSAL's built-in token cache, keyed by user object ID. Cache both the access token and the refresh token. Refresh proactively before expiry (typically 5 minutes before the token's `exp` claim) to avoid failed Graph calls mid-conversation.

---

## Service-to-Service Authentication for Backend Agents

### Overview

Backend agents that operate without a signed-in user context use the client credentials flow. This applies to:

- Scheduled automation agents
- Event-driven agents triggered by system events
- Orchestrating agents calling subordinate agents without user delegation

### Client Credentials Flow

```text
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={appId}
&client_secret={appSecret}
&scope=https://api.botframework.com/.default
```

The token returned is scoped to the Bot Framework service audience. Use it as the `Authorization: Bearer {token}` header when calling Copilot Studio endpoints or peer agent endpoints.

### Certificate-Based Authentication (Preferred for Production)

Replace the client secret with a certificate for stronger credential security:

```text
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={appId}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={signedJwtUsingPrivateKey}
&scope=https://api.botframework.com/.default
```

The `client_assertion` is a JWT signed with the private key of the certificate registered in the app registration. MSAL handles the signing when configured with a certificate credential:

```typescript
const credential = new ClientCertificateCredential(
  tenantId,
  clientId,
  process.env.CERTIFICATE_PATH ?? "",
  { sendCertificateChain: true }
);
```

Use Azure Key Vault to store the certificate. Configure the application with a Key Vault reference rather than a local file path in production.

### Managed Identity (Azure-Hosted Agents)

For agents hosted on Azure (App Service, Container Apps, Azure Functions), use a system-assigned or user-assigned managed identity to eliminate credential management entirely:

1. Enable managed identity on the Azure resource hosting the agent.
2. Grant the managed identity the required role assignments (for example, Bot Contributor on the Bot Service resource).
3. Acquire tokens using the managed identity credential:

```typescript
const credential = new ManagedIdentityCredential();
const tokenResponse = await credential.getToken("https://api.botframework.com/.default");
```

The token is acquired from the Azure Instance Metadata Service (IMDS) endpoint, which is only accessible within the Azure hosted environment. No secrets are stored in configuration.

### Application Roles for Agent Authorization

When an orchestrating agent calls a subordinate agent, the subordinate agent must validate that the caller is authorized. Use Entra ID application roles:

1. In the subordinate agent's app registration, define an application role under **App roles**:

```json
{
  "allowedMemberTypes": ["Application"],
  "description": "Grants permission to invoke the agent as an orchestrating service.",
  "displayName": "Agent.Invoke",
  "id": "00000000-0000-0000-0000-000000000010",
  "isEnabled": true,
  "value": "Agent.Invoke"
}
```

2. In the orchestrating agent's app registration, add the subordinate agent's API permission with the `Agent.Invoke` application role.
3. Grant admin consent for the application role assignment.
4. In the subordinate agent's token validation middleware, assert that the inbound token's `roles` claim includes `Agent.Invoke`.

### Token Validation in the Receiving Agent

The subordinate agent validates the inbound bearer token on every request:

1. Retrieve the OpenID Connect metadata from `https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration`.
2. Fetch the signing keys from the `jwks_uri` in the metadata.
3. Validate the JWT: signature, `iss`, `aud`, `exp`, and `nbf` claims.
4. Assert the required application role in the `roles` claim.
5. Reject requests that fail any validation step with HTTP 401.

Libraries such as `jsonwebtoken` and `jwks-rsa` handle the cryptographic validation. MSAL's `ConfidentialClientApplication.acquireTokenOnBehalfOf` handles the OBO flow on the receiving side when user delegation is required.

---

## Credential Storage and Rotation

| Credential type | Storage recommendation | Rotation frequency |
|---|---|---|
| Client secret | Azure Key Vault secret | 90 days maximum |
| Certificate private key | Azure Key Vault certificate | Annually or on compromise |
| Direct Line secret | Azure Key Vault secret | On staff changes or compromise |
| Managed identity | No credential to store | Not applicable |

### Key Vault Reference Pattern

Reference Key Vault secrets in application configuration rather than storing them in environment files:

```text
@Microsoft.KeyVault(VaultName={vaultName};SecretName={secretName})
```

This pattern is supported natively in Azure App Service and Azure Functions application settings. The secret value is resolved at runtime and is never written to disk or visible in deployment manifests.

---

## Authentication Checklist

| Control | Requirement | Notes |
|---|---|---|
| App registration | Separate registration per agent or application boundary | Do not share app registrations across agents |
| Authentication method | Certificate or managed identity preferred over client secret | Enforce in security policy |
| Scope minimization | Request only the Graph scopes required for current functionality | Review and reduce scope on each sprint |
| Admin consent | Pre-grant admin consent for delegated organizational scopes | Do not rely on user-by-user consent in production |
| SSO fallback | Implement explicit sign-in card fallback when OBO fails | Required for Teams SSO |
| Token caching | Use MSAL token cache with proactive refresh | Prevents mid-conversation token expiry |
| Secret storage | All credentials stored in Key Vault, not in source code | Enforce via pre-commit hooks and policy |
| Role-based authorization | Application roles defined and validated for agent-to-agent calls | Do not rely solely on token presence |
| Token validation | Full JWT validation including signature, audience, issuer, expiry | Validate on every inbound request |
