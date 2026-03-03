# Caddy Analytics  -  Copilot Studio Agent Conversation Analytics Proxy

This directory contains the configuration and tooling for a Caddy v2 reverse
proxy that captures agent conversation metadata for analytics without storing
personally identifiable information (PII).

## Contents

| File | Purpose |
|------|---------|
| `Caddyfile` | Caddy v2 reverse-proxy configuration with structured JSON logging, log rotation, and PII field deletion |
| `log-schema.yaml` | Structured log record schema: field definitions, analytics derivations, and privacy classification |
| `grafana-dashboard.yaml` | Grafana dashboard template for visualising request volume, latency, error rate, sessions, geo, and user-agent data |
| `azure-monitor-adapter.yaml` | Vector sidecar configuration for forwarding logs to Azure Monitor Logs and Application Insights |

## Architecture

```
Client (Teams / Web / Mobile)
        |
        | HTTPS
        v
  Caddy Reverse Proxy  <-- writes JSON access log (PII-stripped)
        |                       |
        | proxies to            | tails log file
        v                       v
  Direct Line / Bot       Vector Sidecar
  Framework endpoints           |
                                | HTTP Data Collector API
                                v
                         Azure Monitor Logs
                         (CaddyAgentAnalytics_CL)
                                |
                                v
                         Grafana / Azure Monitor Workbook
```

## Metrics Captured

| Metric | Source field | Description |
|--------|-------------|-------------|
| Request count per agent endpoint | `request.uri` + `request.method` | Conversations started (POST to `/v3/directline/conversations`) and activity volume by endpoint type |
| Response latency | `duration` (seconds) | End-to-end time from request acceptance to last response byte; used as a proxy for time to first bot response |
| Error rate | `status` | Percentage of responses with HTTP status >= 500 from Direct Line |
| Active sessions | `request.uri` | Count of distinct Direct Line conversation IDs observed in a time window |
| Geographic distribution | `client_region` | GeoIP-derived region code (see GeoIP setup below); raw IP is deleted before log is written |
| User-agent distribution | `request.headers.User-Agent` | Channel classification: Teams, web, mobile, or other |

## Prerequisites

- Caddy v2.7 or later
- `xcaddy` (to build Caddy with required modules)  -  https://github.com/caddyserver/xcaddy
- Vector v0.35 or later (for Azure Monitor forwarding)  -  https://vector.dev
- An Azure Log Analytics workspace (for Azure Monitor integration)

## Quick Start

### 1. Build Caddy with Required Modules

The `filter` encoder for PII field deletion is included in Caddy v2 core.
The GeoIP module requires a custom build:

```bash
xcaddy build \
  --with github.com/porech/caddy-maxmind-geolocation
```

Download a free MaxMind GeoLite2 City database from
https://dev.maxmind.com/geoip/geolite2-free-geolocation-data and place it
at `/etc/caddy/GeoLite2-City.mmdb`.

### 2. Set Environment Variables

```bash
export AGENT_DOMAIN="agents.contoso.com"
export DIRECT_LINE_ENDPOINT="directline.botframework.com"
export BOT_FRAMEWORK_HOST="smba.trafficmanager.net"
export LOG_DIR="/var/log/caddy"
export TLS_EMAIL="platform-eng@contoso.com"
```

Store these in `/etc/caddy/caddy.env` and reference them with
`EnvironmentFile=/etc/caddy/caddy.env` in the systemd service unit.

### 3. Start Caddy

```bash
caddy run --config /path/to/Caddyfile
```

Verify the health endpoint:

```bash
curl -f https://$AGENT_DOMAIN/health
```

### 4. Configure Log Shipping to Azure Monitor (Optional)

1. Install Vector and place `azure-monitor-adapter.yaml` at
   `/etc/vector/vector.yaml`.
2. Set the Azure environment variables:

   ```bash
   export AZURE_LOG_ANALYTICS_WORKSPACE_ID="<workspace-guid>"
   export AZURE_LOG_ANALYTICS_SHARED_KEY="<primary-or-secondary-key>"
   ```

3. Start Vector:

   ```bash
   systemctl enable --now vector
   ```

4. Confirm records appear in the Log Analytics workspace:

   ```kql
   CaddyAgentAnalytics_CL
   | take 10
   ```

### 5. Import the Grafana Dashboard

1. Open Grafana and navigate to **Dashboards > Import**.
2. Upload `grafana-dashboard.yaml` or paste its contents.
3. Select the Loki data source pointing to the Caddy log file
   (configured via Promtail or Grafana Alloy).
4. Set the `logPath` variable to your Promtail job label.

## Geographic Distribution Analytics

Raw IP addresses are deleted at the proxy layer before any log record is
written. To still capture geographic distribution, the MaxMind GeoIP module
must be enabled in the Caddy build (see step 1 above).

Add the following to the site block in the `Caddyfile` after building with
the GeoIP module:

```caddyfile
maxmind_geolocation {
  db_path /etc/caddy/GeoLite2-City.mmdb
  # Emit a client_region header containing the ISO 3166-1 alpha-2 country code.
  allow_countries
  header_name Client-Region
}

# Log the region code.  Because Caddy processes this header before the log
# filter runs, client_region appears in the JSON record while the raw IP
# (request.remote_ip) is still deleted by the filter encoder.
log {
  # ... existing log block ...
  format filter {
    wrap json
    fields {
      request>remote_ip  delete
      # client_region is logged  -  it is the country/region code, not an IP.
    }
  }
}
```

## Privacy and GDPR Compliance

### Data Minimisation

The Caddy `filter` encoder deletes the following fields before any log record
is written to disk or forwarded to Azure Monitor:

| Deleted field | Reason |
|---------------|--------|
| `request.remote_ip` | Client IP address  -  personal data under GDPR Article 4(1) |
| `request.remote_port` | Can be combined with IP for identification |
| `request.headers.Cookie` | May contain session tokens or personal identifiers |
| `request.headers.Authorization` | Bearer tokens or credentials |
| `request.headers.X-Auth-Token` | Custom auth tokens |
| `request.body` | May contain conversation message content |
| `response.body` | May contain conversation message content |

No field containing conversation message text is ever logged.

### Pseudonymous Session Identifiers

The Direct Line conversation ID (extracted from the URL path) is stored in
logs. This is a random opaque token issued by Direct Line and is not linked
to a natural person within these logs. It allows session-level analytics
without re-identification risk, provided the token is not correlated with
identity data from other systems.

**Cross-system correlation warning.** If these logs are joined with other
systems that do associate the Direct Line conversation ID with a natural
person (for example, authentication logs, Azure AD sign-in logs, CRM records,
or Bot Framework transcript storage), the combination constitutes personal
data under GDPR Article 4(1). In that case:

- The legal basis and purpose limitation analysis must be updated.
- Additional data subject rights obligations apply (access, erasure, portability).
- A Data Protection Impact Assessment (DPIA) may be required.
- The Record of Processing Activities (RoPA) must be updated to reflect
  the joined data processing activity.

Keep these Caddy analytics logs in a separate storage location with access
controls that prevent ad-hoc joining with identity-linked systems.

### Legal Basis and Legitimate Interest

Analytics logging is conducted under the legitimate interest basis (GDPR
Article 6(1)(f)). The purpose is limited to service reliability monitoring
and performance optimisation. No profiling, marketing, or automated
decision-making is performed using these logs.

### Data Retention

| Storage location | Retention period | Enforcement mechanism |
|-----------------|-----------------|----------------------|
| Local log files | 30 days | Caddy `roll_keep_for 720h` |
| Azure Monitor Logs | 30 days | Log Analytics workspace retention setting |
| Grafana/Loki | 30 days | Loki retention policy |

To change the local retention period, update `roll_keep_for` in the
`Caddyfile`. To change the Azure Monitor retention period, navigate to
the Log Analytics workspace and update the **Data retention** setting under
**Usage and estimated costs**.

### GDPR Rights Fulfilment

Because no personal data is stored in these logs, data subject access
requests (DSARs) do not produce results from this system. This should be
documented in your Record of Processing Activities (RoPA).

If GeoIP is enabled, the country/region code is not personal data on its
own and does not trigger DSAR obligations.

### Data Processing Agreement

If Azure Monitor or Application Insights is used, ensure a Data Processing
Agreement (DPA) is in place with Microsoft under the Microsoft Products and
Services Data Protection Addendum (DPA). Standard DPAs are included in
Microsoft Online Services Terms.

## Monitoring and Alerting

The Grafana dashboard (`grafana-dashboard.yaml`) includes three pre-configured
alert rules:

| Alert | Condition | Severity |
|-------|-----------|---------|
| High Error Rate | 5xx error rate > 10% for 5 minutes | Critical |
| High Latency p95 | p95 latency > 5 seconds for 5 minutes | Warning |
| No Conversations Started | Zero conversations started in 30 minutes (business hours) | Warning |

Configure the notification channel in Grafana to point to your Teams webhook
or alerting platform.

## Log Rotation

Caddy handles log rotation natively using the following parameters in the
`Caddyfile`:

| Parameter | Value | Effect |
|-----------|-------|--------|
| `roll_size` | 100 MiB | Rotate when file reaches 100 MiB |
| `roll_keep` | 10 | Keep at most 10 rotated files |
| `roll_keep_for` | 720h (30 days) | Delete rotated files older than 30 days |

No external logrotate configuration is required. Caddy uses atomic file
rename operations for rotation, so no log lines are lost during rotation.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No log records written | Confirm `LOG_DIR` is writable by the Caddy process user |
| Vector not forwarding | Run `vector validate --config /etc/vector/vector.yaml` and check `AZURE_LOG_ANALYTICS_WORKSPACE_ID` / `AZURE_LOG_ANALYTICS_SHARED_KEY` |
| Latency values missing | Confirm Caddy version >= 2.7 (earlier versions used `latency` instead of `duration`) |
| GeoIP field absent | Rebuild Caddy with the MaxMind module; confirm the `.mmdb` file path is correct |
| Health check failing | Ensure port 443 is reachable and TLS certificate is provisioned |

## Related Documentation

- [Caddy structured logs](https://caddyserver.com/docs/caddyfile/directives/log)
- [Caddy filter encoder](https://caddyserver.com/docs/json/apps/http/servers/logs/encoder/filter/)
- [Vector Azure Monitor sink](https://vector.dev/docs/reference/configuration/sinks/azure_monitor_logs/)
- [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [Azure Monitor HTTP Data Collector API](https://learn.microsoft.com/azure/azure-monitor/logs/data-collector-api)
- [GDPR Article 4 definitions](https://gdpr-info.eu/art-4-gdpr/)
