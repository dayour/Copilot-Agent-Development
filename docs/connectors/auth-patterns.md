# Authentication Patterns for Custom Connectors

## Overview

This document describes the five authentication patterns available for custom connectors in Power Platform, with guidance on when to use each pattern, how to configure it, and how to manage credentials across environments.

All patterns follow Zero Trust principles: verify explicitly, use least privilege, and assume breach. Secrets must never be stored in connector definitions, flow definitions, or source control. Use Power Platform environment variables of type Secret or Azure Key Vault references.

## Pattern Summary

| Pattern | Template File | Use Cases | Credential Type |
|---|---|---|---|
| OAuth 2.0 Authorization Code | oauth2-auth-code.yaml | User-delegated APIs: Graph, Salesforce, ServiceNow | Client ID and secret, user consent |
| OAuth 2.0 Client Credentials | oauth2-client-credentials.yaml | Service-to-service: ERP systems, ADX, backend APIs | Client ID and secret, no user context |
| API Key (Header) | api-key-header.yaml | Public or partner APIs: weather, mapping, POS | API key in request header |
| API Key (Query) | api-key-query.yaml | Providers requiring query parameter auth | API key in URL query string |
| No Auth | no-auth.yaml | Public open data APIs | None |

## OAuth 2.0 Authorization Code

### When to Use

Use this pattern when the API requires a user identity context: the connector must act on behalf of a specific signed-in user. Common examples include Microsoft Graph, Salesforce, ServiceNow, and SharePoint.

### How It Works

1. The connector redirects the user to the provider authorization endpoint.
2. The user authenticates and consents to the requested scopes.
3. The provider returns an authorization code to the Power Platform callback URL.
4. Power Platform exchanges the code for an access token and refresh token.
5. The access token is passed in the Authorization header for each API call.
6. Power Platform automatically refreshes the access token using the refresh token before it expires.

### Configuration in Power Platform

```yaml
securityDefinitions:
  oauth2_auth_code:
    type: oauth2
    flow: accessCode
    authorizationUrl: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize"
    tokenUrl: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token"
    scopes:
      "<scope>": "Scope description"
    x-ms-client-id: "<client-id>"
    x-ms-client-secret-name: EV_OAUTH_CLIENT_SECRET
```

### Scope Selection

Request only the minimum scopes required for the operations used in production flows. Do not request write scopes if the connector only performs read operations.

### Tenant Restriction

For internal organizational APIs, restrict the authorization URL to the organization tenant:

```text
https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize
```

Do not use the common or consumers endpoints for internal enterprise connectors.

### Token Refresh Handling

Power Platform manages token refresh automatically. If a refresh fails, the connector connection is marked as expired. Monitor connection health using the connector health monitoring solution in `tools/connector-health-check.py` and the `docs/connectors/health-monitoring.md` runbook.

### Credential Rotation

1. Update the client secret in the Entra app registration.
2. Update the `EV_OAUTH_CLIENT_SECRET` environment variable in all affected environments.
3. Re-authenticate all connections using the updated secret.
4. Validate the connector health probe returns HTTP 200 after rotation.

## OAuth 2.0 Client Credentials

### When to Use

Use this pattern for service-to-service integrations where no user identity is required. The connector authenticates as an application (service principal), not as a user. Common examples include ERP system sync flows, Azure Data Explorer analytics queries, and batch data pipelines.

### How It Works

1. The connector sends the client ID and client secret to the token endpoint.
2. The provider returns an access token scoped to the application.
3. The access token is passed in the Authorization header for each API call.
4. Power Platform refreshes the token automatically before expiry (typically 3600 seconds).

### Configuration in Power Platform

```yaml
securityDefinitions:
  oauth2_client_credentials:
    type: oauth2
    flow: application
    tokenUrl: "https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token"
    scopes:
      "<resource>/.default": "Default scope"
    x-ms-client-id: "<client-id>"
    x-ms-client-secret-name: EV_CC_CLIENT_SECRET
```

### Application Permission Grants

For Entra-backed APIs, the service principal requires application permissions (not delegated). An Entra global administrator must grant admin consent before the connector can acquire tokens.

### Least Privilege

Create a dedicated service principal per integration boundary. Do not share service principals across multiple connectors or verticals. Grant only the application permissions required for the specific operations in the connector.

### Credential Rotation

1. Add a new client secret to the Entra app registration.
2. Update the environment variable before the old secret expires.
3. Validate the connector health probe returns HTTP 200.
4. Remove the old client secret from the app registration after validation.

## API Key (Header)

### When to Use

Use this pattern for third-party APIs that use a static API key passed in a request header. This is the preferred API key pattern because header values are encrypted in TLS and are less likely to appear in access logs compared to query parameters. Common examples include Samsara, WEX fuel card API, Shopify, and mapping services.

### How It Works

The API key is included in a named request header on every API call. The key is provisioned by the API provider and stored in a Power Platform environment variable of type Secret.

### Configuration in Power Platform

```yaml
securityDefinitions:
  apiKeyHeader:
    type: apiKey
    in: header
    name: x-api-key
```

### Common Header Names by Provider

| Provider | Header Name |
|---|---|
| Samsara | Authorization (with "Bearer " prefix) |
| Shopify | X-Shopify-Access-Token |
| WEX / Comdata | x-api-key |
| HERE Maps | apikey (query, not header) |
| Generic | x-api-key or Authorization |

### Credential Rotation

1. Generate a new API key in the provider portal.
2. Update the environment variable in all affected environments simultaneously to minimize downtime.
3. Test the connector health probe before deleting the old key from the provider.
4. Rotate every 90 days or immediately upon suspected exposure.

## API Key (Query Parameter)

### When to Use

Use this pattern only when the API provider requires the key as a URL query parameter and does not support header-based key authentication. This pattern is less secure because query parameters appear in server access logs, proxy logs, and browser history.

### Security Mitigations

- Always use HTTPS (TLS 1.2 or higher).
- Rotate keys more frequently than header-based keys (every 30 to 60 days).
- Monitor the provider's access logs for unexpected usage patterns.
- Apply IP allowlisting at the provider level where supported.

### Configuration in Power Platform

```yaml
securityDefinitions:
  apiKeyQuery:
    type: apiKey
    in: query
    name: apikey
```

### Credential Rotation

Same process as API Key (Header). Pay additional attention to audit log review after rotation to confirm the old key is no longer in use.

## No Authentication

### When to Use

Use this pattern for truly public APIs that require no credentials. Before using this pattern, verify that the API does not return PII or confidential data, and confirm the provider terms of service allow automated access.

### DLP Classification

Classify no-auth connectors as Non-Business unless the API returns organizational data. Review the connector in DLP policy to confirm it is in the correct group before deploying to production.

### Rate Limit Awareness

Public APIs often enforce per-IP rate limits without authentication. Implement caching in calling flows to reduce unnecessary repeated calls to the same endpoints.

## General Guidelines for All Patterns

### Secret Storage

All API keys and client secrets must be stored in Power Platform environment variables of type Secret or in Azure Key Vault. Never embed secrets in:

- Connector definition YAML files
- Flow definitions
- Environment variable string values
- Source control commits

### Connection References

Always use solution-aware connection references to bind connectors to connections. This ensures consistent identity across environments and supports ALM-compliant deployments.

```yaml
connectionReferences:
  - name: cr_pos_coffee
    connector: custom_coffee_pos
  - name: cr_erp_clothing
    connector: custom_clothing_erp
```

### Rotation Schedule

| Pattern | Recommended Rotation Interval |
|---|---|
| OAuth 2.0 client secret | 90 days |
| API key (header) | 90 days |
| API key (query) | 30 to 60 days |
| No auth | Not applicable |

### Monitoring

Monitor authentication health using the connector health monitoring solution. Configure alerts for:

- Connection status Expired or Revoked
- Token refresh failure rate greater than 0
- HTTP 401 or 403 responses from connector health probes

See `docs/connectors/health-monitoring.md` for the full monitoring runbook.

## Template Files

The following OpenAPI 2.0 (Swagger) template files are available in `docs/connectors/templates/`:

| File | Pattern | Vertical |
|---|---|---|
| oauth2-auth-code.yaml | OAuth 2.0 Authorization Code | Cross-vertical |
| oauth2-client-credentials.yaml | OAuth 2.0 Client Credentials | Cross-vertical |
| api-key-header.yaml | API Key (Header) | Cross-vertical |
| api-key-query.yaml | API Key (Query) | Cross-vertical |
| no-auth.yaml | No Authentication | Cross-vertical |
| coffee-pos-integration.yaml | OAuth 2.0 Authorization Code | Coffee |
| clothing-erp-integration.yaml | OAuth 2.0 Client Credentials | Clothing |
| clothing-pos-integration.yaml | API Key (Header) | Clothing |
| insurance-claims-system.yaml | OAuth 2.0 Authorization Code | Insurance |
| insurance-actuarial-system.yaml | OAuth 2.0 Client Credentials | Insurance |
| tech-ticketing-system.yaml | OAuth 2.0 Authorization Code | Tech |
| tech-azure-data-explorer.yaml | OAuth 2.0 Client Credentials | Tech |
| transportation-fleet-gps.yaml | API Key (Header) | Transportation |
| transportation-fuel-card.yaml | API Key (Header) | Transportation |
