# Custom Connector Troubleshooting Guide

## Overview

This guide provides structured troubleshooting procedures for the most common issues encountered when developing, deploying, and operating custom connectors across the five verticals. Use it alongside the connector health monitoring dashboard described in `docs/connectors/health-monitoring.md`.

## Quick Reference

| Symptom | Most Likely Cause | Jump To |
|---|---|---|
| HTTP 401 on all operations | Expired or revoked credentials | Authentication Failures |
| HTTP 403 on specific operations | Missing scope or permission | Authorization Failures |
| HTTP 429 with retry loops | Rate limit exceeded | Rate Limit Errors |
| Connector import fails in Power Platform | Invalid OpenAPI definition | Import and Definition Errors |
| Flow runs but connector returns no data | Wrong endpoint or filter | Empty or Incorrect Responses |
| Connector works in test but fails in production | Environment variable mismatch | Environment and ALM Issues |
| Token refresh failures in health monitoring | Refresh token expired | Token Refresh Failures |
| Intermittent timeouts | Slow API or large payloads | Timeout and Performance Issues |
| DLP policy violation error | Connector classification mismatch | DLP Policy Violations |

## Authentication Failures

### Symptoms

- HTTP 401 Unauthorized on all connector operations.
- Connection status shows as Expired or Revoked in Power Platform Admin Center.
- Token refresh failure alerts in the connector health monitoring flow.

### Diagnosis Steps

1. Open Power Platform Admin Center and navigate to the target environment.
2. Select Connections and find the affected connection reference.
3. Check the connection status. If it shows Expired or Error, re-authenticate.
4. Check the token endpoint and client ID in the connector definition for typos.
5. For OAuth 2.0, verify the authorization URL and token URL match the provider's current endpoints.
6. For API key connectors, test the key directly with a simple curl command from a trusted network.

### Remediation by Pattern

#### OAuth 2.0 Authorization Code

1. Open the connection in Power Platform Admin Center.
2. Select Fix Connection or Re-authenticate.
3. Complete the user consent flow in the browser popup.
4. Confirm the connection status returns to Connected.
5. If the client secret has expired, rotate it in the Entra app registration first.

#### OAuth 2.0 Client Credentials

1. Verify the client secret has not expired in the Entra app registration.
2. Update the environment variable `EV_CC_CLIENT_SECRET` or equivalent with the new secret.
3. Re-authenticate the connection in Power Platform Admin Center.
4. Check that admin consent is still granted for the application permissions.
5. Run the connector health check probe and confirm HTTP 200.

#### API Key

1. Verify the API key is valid by testing it directly with the provider's documentation portal or API explorer.
2. Update the environment variable holding the API key.
3. Re-authenticate the connector connection in Power Platform Admin Center.
4. Confirm the key has not been suspended by the provider due to inactivity or abuse.

### Prevention

- Set up credential expiry alerts 30 days before rotation deadlines.
- Monitor the connector health dashboard for token refresh failure metrics.
- Automate client secret rotation using Azure Key Vault rotation policies where possible.

## Authorization Failures

### Symptoms

- HTTP 403 Forbidden on specific operations.
- HTTP 200 on read operations but 403 on write operations.
- Specific users receive 403 while others do not (delegated access issue).

### Diagnosis Steps

1. Identify which specific operation and endpoint is returning 403.
2. Review the connector template to confirm the required scope is listed for that operation.
3. For OAuth 2.0 Authorization Code: verify the user has consented to the required scope.
4. For OAuth 2.0 Client Credentials: verify the application permission is granted and admin consent is current.
5. For API key: verify the API subscription plan includes the requested endpoint.

### Remediation

| Cause | Resolution |
|---|---|
| Missing OAuth scope in connector definition | Add the required scope to the connector definition and re-publish |
| User has not consented to scope | Re-authenticate the connection so the user can consent to updated scopes |
| Application permission not granted | Add the permission in Entra admin center and grant admin consent |
| API subscription plan limitation | Contact the provider to upgrade the plan or add the endpoint to the key's access list |
| IP allowlist restriction | Register the Power Platform outbound IP ranges with the API provider |

## Rate Limit Errors

### Symptoms

- HTTP 429 Too Many Requests on connector operations.
- Flow run history shows repeated retries.
- The connector health dashboard shows rate limit utilization approaching or exceeding 80%.

### Diagnosis Steps

1. Open the flow run history and identify the connector action returning 429.
2. Check the `Retry-After` or `X-RateLimit-Reset` response header for the wait interval.
3. Review the calling flow for parallel branches that may be issuing concurrent requests.
4. Check the connector health dashboard for rate limit utilization trends over the past 24 hours.

### Remediation

1. Add an exponential backoff retry loop after the connector action:

```text
If StatusCode = 429:
  Extract Retry-After header value (default to 30 if absent)
  Wait Retry-After seconds
  Retry up to 5 attempts
```

2. Reduce parallel branch concurrency in calling flows. Set the concurrency control to 1 or 2 for rate-limited connectors.
3. Add a delay action between sequential calls if the flow issues many requests in a loop.
4. Cache frequently read, slowly changing data to reduce unnecessary API calls.
5. Contact the API provider to request a quota increase if the sustained load exceeds the plan limit.

### Provider-Specific Rate Limit Guidance

| Provider | Limit | Header |
|---|---|---|
| Samsara | Per-token, varies by endpoint | X-RateLimit-Remaining |
| Square | 100 requests per 10 seconds per token | X-Rate-Limit-Remaining |
| Shopify | 40 requests per app per store (leaky bucket) | X-Shopify-Shop-Api-Call-Limit |
| ServiceNow | 3000 requests per hour per user token | X-RateLimit-Limit |
| Azure Data Explorer | Per-cluster concurrency limits | Internal; check query results |

## Import and Definition Errors

### Symptoms

- Custom connector import fails in Power Platform with a validation error.
- Specific operations are missing after import.
- Power Platform shows a warning about unsupported extensions.

### Diagnosis Steps

1. Copy the connector definition YAML and validate it with a YAML linter.
2. Check that the file uses `swagger: "2.0"` at the top level.
3. Confirm all operations have a unique `operationId` with no special characters other than letters and digits.
4. Check that all `$ref` values resolve to definitions in the same file.
5. Verify that all paths start with `/` and do not include the base URL.

### Common Definition Errors

| Error | Cause | Fix |
|---|---|---|
| Duplicate operationId | Two operations have the same ID | Rename one of the operationId values |
| Invalid $ref | Reference points to a non-existent definition | Add the missing definition or correct the path |
| Unsupported flow type | Using OpenAPI 3.0 instead of 2.0 | Convert to Swagger 2.0 format |
| Missing required field | `host`, `paths`, or `info` is absent | Add the missing field |
| Invalid YAML syntax | Indentation error or tab character | Validate YAML syntax and use 2-space indentation |

### Validation Tools

Use the following to validate connector definitions before import:

- Online YAML validator to check syntax.
- Swagger Editor at editor.swagger.io to validate OpenAPI 2.0 compliance.
- Power Platform CLI: `pac connector validate --file <path-to-yaml>` where available.

## Empty or Incorrect Responses

### Symptoms

- The connector returns HTTP 200 but the response body is empty or contains unexpected data.
- Fields that should be populated are null.
- Pagination returns the same page repeatedly.

### Diagnosis Steps

1. Test the operation directly against the API using a REST client (Postman, curl) with the same credentials and parameters.
2. Compare the live API response schema against the connector definition schema.
3. Check whether the request is missing required query parameters or headers.
4. For paginated operations, verify the pagination cursor or offset is being passed correctly from one call to the next.

### Remediation

| Cause | Resolution |
|---|---|
| Schema drift | Update the connector definition response schema to match the current API response |
| Missing query parameters | Add required parameters to the connector operation and calling flow |
| Incorrect pagination handling | Read the Link header or cursor field from the response and pass it to the next call |
| Filter too restrictive | Review the sysparm_query or filter expression for correctness |
| Field projection missing required fields | Remove explicit field selection or add the missing field to the sysparm_fields list |

## Environment and ALM Issues

### Symptoms

- Connector works in development but fails in test or production.
- Flow imports successfully but fails to authenticate after import.
- Operations return data from the wrong environment or system.

### Diagnosis Steps

1. Verify that the environment variable values are set correctly in the target environment.
2. Confirm the connection reference is bound to the correct connection in the target environment.
3. Check that the API host in the connector definition matches the target environment's API endpoint.
4. Review environment variable type: secrets must be type Secret, not type String.

### Common ALM Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Missing environment variable | Flow fails with null connection string or empty host | Set the environment variable value in the target environment |
| Connection reference unbound | Flow fails with missing connection error | Bind the connection reference to a connection in Admin Center after import |
| Wrong environment variable value | Flow calls the wrong API host | Review and correct the environment variable value |
| String-typed secret | Secret value is visible in environment variable | Recreate the variable with type Secret |

## Token Refresh Failures

### Symptoms

- Connector health monitoring dashboard shows token refresh success rate below 100%.
- Agents receive 401 errors after a period of inactivity.
- Connection status shows Expired after a scheduled flow runs overnight.

### Diagnosis Steps

1. Identify the affected connector and connection reference from the health monitoring alert.
2. Check whether the OAuth refresh token has expired. Refresh tokens can expire if the connection has been inactive for the provider's refresh token lifetime.
3. Check whether the client secret used for token acquisition has expired.
4. For Authorization Code: check if the user who created the connection has left the organization or had their account disabled.

### Remediation

1. Re-authenticate the connection by opening it in Power Platform Admin Center and selecting Fix Connection.
2. For service accounts: ensure the service account is active and has the required permissions.
3. For client secrets: rotate the secret and update the environment variable before re-authenticating.
4. For user-owned connections in scheduled flows: replace with a service account connection to prevent expiry due to user inactivity.

## Timeout and Performance Issues

### Symptoms

- Connector operations take longer than expected or time out.
- Flow run history shows action duration exceeding 30 seconds.
- Intermittent failures with no clear error code.

### Diagnosis Steps

1. Measure the baseline response time for the operation using a REST client.
2. Check the payload size of the request and response. Large payloads increase latency.
3. Check whether the query or filter is retrieving more data than necessary.
4. Review the ADX query for missing time-range filters (ADX only).

### Remediation

| Cause | Resolution |
|---|---|
| Oversized response payload | Add field projection to reduce returned columns |
| Missing query filter | Add a date range or status filter to narrow results |
| No pagination | Enable pagination and process records in pages of 100 or fewer |
| Serial flow with many connector calls | Move to a scheduled batch flow instead of real-time agent response |
| ADX query without time filter | Add where ingestion_time() > ago(1h) or equivalent filter |
| Synchronous chaining of slow actions | Move slow actions to a child flow called asynchronously |

## DLP Policy Violations

### Symptoms

- Flow run fails with a DLP policy violation error.
- Connector cannot be added to a flow because it is blocked.
- Admin Center audit log shows a DLP violation event.

### Diagnosis Steps

1. Identify which two connectors in the flow are in different DLP groups (Business and Non-Business, or Business and Blocked).
2. Review the DLP classification for each connector in `docs/connectors/dlp-classification-guide.md`.
3. Determine whether the classification is correct or if a reclassification is needed.

### Remediation

1. If the connector classification is incorrect, submit a reclassification request to Platform Engineering.
2. If the flow design mixes data tiers intentionally, split the flow into two separate flows, each operating within a single DLP group.
3. If a Non-Business connector needs to work with Business data, reclassify it as Business after a security review.
4. Document any exceptions and obtain compliance approval before bypassing DLP controls.

## Escalation Path

| Severity | Who to Contact | Timeline |
|---|---|---|
| Critical (production outage) | Platform Engineering on-call, plus Vertical Lead | Immediate |
| High (degraded production connector) | Platform Engineering | Within 2 hours |
| Medium (test environment failure) | Agent Engineering team | Within 1 business day |
| Low (development issue) | Agent Engineering team | Within 2 business days |

## Related Documents

- `docs/connectors/auth-patterns.md` - Authentication pattern configuration
- `docs/connectors/dlp-classification-guide.md` - DLP classification guidance
- `docs/connectors/certification-checklist.md` - Connector certification requirements
- `docs/connectors/health-monitoring.md` - Health monitoring solution and alert runbook
- `docs/connectors.md` - Complete connector inventory and governance overview
