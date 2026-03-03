# Fuel Tracking Agent Deployment Runbook

## 1. Purpose

This runbook defines deployment, validation, monitoring, and rollback for the Fuel Tracking Copilot Studio agent used by transportation operations, driver support, and finance teams.

## 2. Prerequisites

### Platform and Licensing

- Microsoft Copilot Studio license for makers and target users
- Power Automate Premium license (required for premium connectors and HTTP integrations)
- Dataverse environment with sufficient capacity
- Power Platform admin access for solution import and connection references

### External System Access

- Fuel card provider API access (WEX, Comdata, or FLEETCOR)
  - API base URL
  - API key or OAuth credentials
  - Card management and transaction endpoints enabled
- Telematics API access
  - Vehicle GPS feed endpoint
  - Fuel level/engine hours feed endpoint
  - API credentials
- Fuel price API access
  - Regional retail price endpoints
  - API key and usage quotas

### Security and Operations

- Approved service account for connector authentication
- Alert destination mailbox for finance and fraud escalation
- Change window approved by fleet operations

## 3. Solution Import

1. Open target Power Platform environment.
2. Import managed solution package for Fuel Tracking.
3. Resolve all connection references during import.
4. Set environment variables.
5. Publish customizations.
6. Verify all cloud flows are turned on.

### Required Environment Variables

| Variable Name | Description | Example |
|---|---|---|
| FuelCardApiUrl | Fuel card provider REST base URL | `https://api.fuelcardprovider.com/v1` |
| FuelCardApiKey | Fuel card API key or token reference | `kv://fuelcard/api-key` |
| TelematicsApiUrl | Telematics REST base URL | `https://api.telematicsvendor.com/v2` |
| TelematicsApiKey | Telematics API key or token reference | `kv://telematics/api-key` |
| FuelPriceApiKey | Fuel price API key | `kv://fuelprice/api-key` |
| FinanceAlertEmail | Finance/fraud distribution list | `fleet-finance-alerts@contoso.com` |
| AnomalyThresholdGallons | Default overfill threshold in gallons | `5` |

## 4. Dataverse Table Provisioning

Provision and validate the following tables before enabling production traffic:

- `FuelTransactions`
- `VehicleFuelProfiles`
- `FuelAnomalies`
- `FuelAnomalyRules`
- `FuelCards`

### Validation Steps

1. Confirm tables are present in solution.
2. Confirm primary keys and required columns exist.
3. Validate data types for cost, gallons, geolocation, and timestamp fields.
4. Validate indexes for high-read queries (`transaction_id`, `card_number`, `vehicle_id`, `timestamp`).
5. Seed anomaly rules and run a dry test execution.

## 5. Knowledge Source Configuration

Configure knowledge sources in Copilot Studio:

- Fleet fuel policy documents (approved fueling windows, approved merchants, spend controls)
- Fraud investigation SOP and escalation procedures
- Driver fueling compliance guidelines
- Regional reimbursement and exception policies

Knowledge source recommendation:
- SharePoint document library for controlled policy content
- Refresh cadence: daily or on policy-change trigger

## 6. Authentication and Authorization

1. Configure Entra ID authentication for enterprise users.
2. Enable SSO where supported by channel (Teams first).
3. Map user role attributes (fleet manager, driver, finance analyst) to conversational branching.
4. Restrict card-management actions to authorized roles.
5. Enable audit logging for high-risk actions (card suspension/reactivation).

## 7. Channel Deployment

### Teams

1. Enable Teams channel in Copilot Studio.
2. Validate sign-in experience and user context.
3. Validate response formatting for desktop and mobile Teams clients.
4. Publish Teams app to pilot group, then broad rollout.

### Mobile Web Chat

1. Enable web channel and generate embed configuration.
2. Apply branding and security headers.
3. Validate authentication redirect handling on mobile browsers.
4. Validate latency under expected concurrency.

## 8. Validation Checklist

### Functional Tests

- [ ] Fuel summary topic returns aggregated spend — correct totals from Dataverse FuelTransactions, matching manual calculation
- [ ] Vehicle fuel profile shows MPG and trend — accurate MPG, trend data consistent with transaction history
- [ ] Fuel price query returns current prices — external API returns valid, current prices for specified corridor
- [ ] Fuel card suspension flow executes — card status changes to suspended in fuel card provider system
- [ ] Driver Efficiency returns ranked drivers with normalization context
- [ ] Transaction Lookup returns correct filtered transactions

### Anomaly Rule Tests

Validate each anomaly type with positive and negative test data:

- [ ] Anomaly detection flags test transaction exceeding tank capacity — volume anomaly alert generated with correct evidence
- [ ] Multiple fills in short interval
- [ ] Off-route fueling (distance threshold)
- [ ] After-hours fueling
- [ ] Price above market threshold
- [ ] Split transactions at same merchant window
- [ ] Potential phantom fill using telematics mismatch signals

## 9. Monitoring Cadence

### Daily

- Transaction ingestion health (flow runs, API failures, ingestion lag)
- Anomaly detection rate trend by rule type
- Failed card-operation attempts

### Weekly

- False positive rate review by fleet and rule
- Top vehicles/drivers by anomaly count
- Fuel spend variance vs budget

### Monthly

- Rule tuning review with finance and operations
- Connector/API quota and performance review
- Policy documentation freshness review

## 10. Escalation Matrix

| Severity | Trigger | Owner | SLA |
|---|---|---|---|
| Sev 1 | Ingestion outage, no new transactions | Platform Ops + Integration Team | 1 hour |
| Sev 2 | High false positive burst, investigation delays | Data/Analytics + Fleet Ops | 4 hours |
| Sev 3 | Single rule degradation or channel issue | Product Owner + Support | 1 business day |

Notification path:
1. Automated alert to `FinanceAlertEmail`
2. Incident channel post with impact summary
3. On-call engineer assignment and triage

## 11. Rollback Procedure

1. Disable Teams and web publication for Fuel Tracking agent.
2. Turn off high-risk flows (card suspend/reactivate) if behavior is unsafe.
3. Revert to last known good managed solution version.
4. Restore previous environment variable values.
5. Re-run smoke tests for summary, lookup, and anomaly scenarios.
6. Communicate rollback completion and residual risk to stakeholders.

## 12. Post-Deployment Operational Notes

- Maintain change log for rule threshold changes.
- Use staged rollout for new anomaly rules.
- Keep card action confirmation mandatory in production.
- Keep finance and fleet operations in weekly review loop for tuning.

