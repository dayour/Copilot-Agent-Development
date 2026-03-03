# Custom Connector Certification Checklist

## Overview

This checklist defines the controls that must be verified before a custom connector is approved for use in a production Power Platform environment. Complete all applicable checks and obtain sign-off from the roles specified in each section.

Use one checklist instance per connector per environment tier (development, test, production).

## Connector Information

| Field | Value |
|---|---|
| Connector Name | |
| Vertical | |
| API Host | |
| Authentication Pattern | |
| Template Used | |
| Reviewer | |
| Review Date | |
| Environment Tier | |

## Section 1: OpenAPI Definition Quality

| Control | Requirement | Status |
|---|---|---|
| Swagger version | File uses `swagger: "2.0"` (OpenAPI 2.0) | |
| Title and description | `info.title` and `info.description` are populated | |
| Version | `info.version` is set | |
| Host | `host` is set to the correct API hostname | |
| Schemes | `schemes` includes `https` only; `http` is not listed | |
| Consumes and produces | Both set to `application/json` unless the API requires otherwise | |
| Operation IDs | All operations have unique, descriptive `operationId` values | |
| Summaries | All operations have `x-ms-summary` set | |
| Visibility | All operations have `x-ms-visibility` set (`important`, `advanced`, or `internal`) | |
| Parameter descriptions | All parameters have `description` and `x-ms-summary` | |
| Response schemas | All 2xx responses have a defined schema | |
| Error responses | 401, 403, 429, and 500 responses are defined for all operations | |
| No inline secrets | No API keys, client secrets, or tokens appear in the YAML file | |

## Section 2: Authentication Configuration

| Control | Requirement | Status |
|---|---|---|
| Auth pattern documented | Authentication type matches `docs/connectors/auth-patterns.md` guidance | |
| Secret storage | API keys and client secrets stored in environment variables of type Secret | |
| No plaintext secrets | No secrets in connector YAML, flow definitions, or source control | |
| Scope minimization | OAuth scopes limited to minimum required for production operations | |
| Tenant restriction | OAuth 2.0 authorization URLs restricted to the organization tenant | |
| Service principal dedicated | Client credentials pattern uses a dedicated service principal per connector | |
| Admin consent granted | OAuth 2.0 application permissions have admin consent in all target environments | |
| Rotation schedule documented | Credential rotation interval defined in runbook | |

## Section 3: DLP Classification

| Control | Requirement | Status |
|---|---|---|
| Classification assigned | Connector is classified as Business, Non-Business, or Blocked | |
| Classification justification | Data types and sensitivity level are documented | |
| Policy environment verified | Connector classification is reflected in the target environment DLP policy | |
| Business isolation confirmed | Flow does not pair Business and Non-Business connectors in the same flow | |
| Blocked connector check | No blocked connectors are used in the same flow or app as this connector | |

## Section 4: Power Platform Extensions

| Control | Requirement | Status |
|---|---|---|
| x-ms-summary | Applied to all operations and parameters | |
| x-ms-visibility | Applied to all operations | |
| x-ms-dynamic-values | Used for parameters with a bounded set of valid values (e.g., status enums) | |
| x-ms-connector-metadata | Website and privacy policy entries are populated | |
| Test connection | `x-ms-capabilities.testConnection: true` is set | |

## Section 5: Error Handling and Resilience

| Control | Requirement | Status |
|---|---|---|
| Retry policy | Calling flows implement exponential backoff for 429, 502, 503, 504 responses | |
| Dead-letter handling | Hard failures (4xx non-transient) are logged to a dead-letter store | |
| Correlation ID logging | Correlation ID is captured and logged for all connector calls | |
| Operations alert | Teams notification is triggered for persistent failures | |
| No silent failures | Flows do not silently ignore errors; all catch branches log and alert | |
| User-facing error messages | Agent topics surface friendly error messages without raw API error details | |

## Section 6: Rate Limit Handling

| Control | Requirement | Status |
|---|---|---|
| Rate limit documented | Provider rate limits are documented in the connector template comments | |
| Retry-After respected | Flows read and honor the Retry-After response header on 429 responses | |
| Quota monitoring | Rate limit utilization is logged to the Dataverse connector health table | |
| Parallelism limited | Flows do not use unbounded parallel branches for rate-limited connectors | |
| Caching implemented | Frequently read, slowly changing data is cached to reduce API call volume | |

## Section 7: ALM Readiness

| Control | Requirement | Status |
|---|---|---|
| Solution-aware | Connector is included in a Power Platform solution | |
| Connection reference | A solution-aware connection reference is defined for each connector connection | |
| Environment variables | All configuration values use environment variables; no hardcoded URLs or keys | |
| Import validation | Solution can be imported cleanly into a fresh development environment | |
| Deployment runbook | Deployment steps are documented in the vertical runbook.md | |

## Section 8: Security Review

| Control | Requirement | Status |
|---|---|---|
| HTTPS only | All connector endpoints use HTTPS; no HTTP endpoints are defined | |
| TLS version | Provider enforces TLS 1.2 or higher | |
| IP allowlisting | Registered Power Platform IP ranges with the provider where supported | |
| Data minimization | Connector requests only the fields required for agent operations | |
| PII handling | PII fields are not logged in telemetry or dead-letter stores | |
| Least privilege | Service accounts and app permissions are scoped to minimum requirements | |
| Vulnerability assessment | No known vulnerabilities in the connector authentication flow | |

## Section 9: Test Validation

| Control | Requirement | Status |
|---|---|---|
| Health check passes | The connector health check operation returns HTTP 200 | |
| Read operations validated | All GET/list operations return expected data from a test record set | |
| Write operations validated | All POST/PATCH operations succeed and produce correct outcomes | |
| Auth failure tested | Invalid credentials return 401; error is handled gracefully in the flow | |
| Rate limit tested | 429 response is handled with backoff; flow does not fail permanently | |
| Connection reference bound | Connection reference resolves correctly in the target environment | |
| Health monitoring registered | Connector probe is registered in the `ConnectorHealthCheckScheduled` flow | |

## Section 10: Documentation

| Control | Requirement | Status |
|---|---|---|
| README updated | Agent README.md references the connector and its purpose | |
| Runbook updated | Deployment and operational steps are in the vertical runbook.md | |
| Template committed | The OpenAPI YAML template is committed to `docs/connectors/templates/` | |
| DLP guide updated | New connector classification is added to `docs/connectors/dlp-classification-guide.md` | |
| Auth pattern documented | If a new auth pattern is used, it is described in `docs/connectors/auth-patterns.md` | |

## Sign-Off

| Role | Name | Date | Approval |
|---|---|---|---|
| Agent Engineering | | | |
| Platform Engineering | | | |
| Security Architecture | | | |
| Compliance (if PII or regulated data) | | | |

## Notes

Use this section to document deviations, waivers, or follow-up actions required before or after certification.

```text
[Record deviations and waivers here]
```
