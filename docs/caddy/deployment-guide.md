# Caddy Deployment Guide

## Overview

This guide covers production deployment of Caddy as a reverse proxy for Copilot Studio web chat endpoints. It addresses server provisioning, binary installation, environment configuration, systemd service setup, certificate management, and operational monitoring.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Linux server (Ubuntu 22.04 LTS recommended) | VM or bare metal with public IP and inbound ports 80 and 443 open |
| Custom domain with DNS control | A record pointing to the server IP |
| Azure Bot Service Direct Line channel enabled | Secret retrieved from Bot Channels Registration |
| Copilot Studio web chat endpoint URL | From agent publishing settings |
| TLS email address | Used for Let's Encrypt registration and expiry notifications |
| `xcaddy` (optional) | Required only when adding third-party modules such as `caddy-ratelimit` |

---

## Step 1: Install Caddy

### Option A: Official package repository (recommended for standard deployments)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Verify installation:

```bash
caddy version
```

### Option B: Build with xcaddy (required for rate-limit module)

```bash
# Install xcaddy
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

# Build Caddy with the rate-limit module
xcaddy build \
  --with github.com/mholt/caddy-ratelimit

# Replace system binary
sudo mv caddy /usr/bin/caddy
sudo chmod +x /usr/bin/caddy
sudo setcap cap_net_bind_service=+ep /usr/bin/caddy
```

---

## Step 2: Create Directory Structure

```bash
sudo mkdir -p /etc/caddy
sudo mkdir -p /var/log/caddy
sudo mkdir -p /etc/caddy/env.d

sudo chown -R caddy:caddy /var/log/caddy
sudo chmod 750 /var/log/caddy
```

---

## Step 3: Install the Caddyfile

Copy the appropriate template from `docs/caddy/caddyfile-templates/` to `/etc/caddy/Caddyfile`.

For a single-agent deployment:

```bash
sudo cp docs/caddy/caddyfile-templates/single-agent.Caddyfile /etc/caddy/Caddyfile
sudo chown root:caddy /etc/caddy/Caddyfile
sudo chmod 640 /etc/caddy/Caddyfile
```

---

## Step 4: Configure Environment Variables

Create an environment file that holds all secrets and site-specific values. This file is referenced by the systemd unit and is never committed to version control.

```bash
sudo tee /etc/caddy/env.d/agent.env > /dev/null <<'EOF'
# Single-agent deployment example
AGENT_DOMAIN=agent.contoso.com
COPILOT_UPSTREAM=https://<your-copilot-studio-endpoint>.azurewebsites.net
DIRECTLINE_SECRET=<your-directline-secret>
ALLOWED_ORIGINS=https://agent.contoso.com
RATE_LIMIT_REQUESTS=20
RATE_LIMIT_WINDOW=10s
LOG_FILE=/var/log/caddy/access.log
TLS_EMAIL=ops@contoso.com
EOF

sudo chown root:caddy /etc/caddy/env.d/agent.env
sudo chmod 640 /etc/caddy/env.d/agent.env
```

For the multi-agent gateway, replace the variables with those documented in `multi-agent-gateway.Caddyfile`. For multi-tenant, use the variables documented in `multi-tenant.Caddyfile`.

---

## Step 5: Configure systemd Service

The Caddy package installs a default systemd unit. Override it to load the environment file.

```bash
sudo mkdir -p /etc/systemd/system/caddy.service.d

sudo tee /etc/systemd/system/caddy.service.d/override.conf > /dev/null <<'EOF'
[Service]
EnvironmentFile=/etc/caddy/env.d/agent.env
# Restart policy
Restart=on-failure
RestartSec=5s
# Harden service isolation
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=full
ReadWritePaths=/var/log/caddy /var/lib/caddy
EOF

sudo systemctl daemon-reload
```

Start and enable Caddy:

```bash
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
```

---

## Step 6: Validate TLS Certificate Issuance

Caddy automatically requests a certificate on first request. Check that the certificate was issued:

```bash
# Check Caddy logs for ACME activity
sudo journalctl -u caddy -f

# Confirm certificate is valid
curl -sv https://${AGENT_DOMAIN}/healthz 2>&1 | grep -E "subject|issuer|expire"
```

Expected output shows a certificate issued by Let's Encrypt or ZeroSSL. The specific intermediate CA name varies by Let's Encrypt issuance policy; confirm via the issuer field in the OpenSSL output.

---

## Step 7: Validate Reverse Proxy

```bash
# Health check
curl https://${AGENT_DOMAIN}/healthz

# Direct Line token proxy (expect JSON with token field)
curl -X POST https://${AGENT_DOMAIN}/api/token

# Confirm security headers are present
curl -sI https://${AGENT_DOMAIN}/ | grep -E "Strict-Transport|Content-Security|X-Frame|X-Content-Type"
```

---

## Step 8: Configure Log Rotation

Caddy handles its own log rolling (configured via `roll_size`, `roll_keep`, `roll_keep_for` in the Caddyfile). If you also want system-level rotation via logrotate:

```bash
sudo tee /etc/logrotate.d/caddy > /dev/null <<'EOF'
/var/log/caddy/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload caddy
    endscript
}
EOF
```

---

## Updating the Caddyfile

After editing `/etc/caddy/Caddyfile`, validate and reload without downtime:

```bash
# Validate syntax
caddy validate --config /etc/caddy/Caddyfile

# Zero-downtime reload
sudo systemctl reload caddy
```

---

## Rotating Secrets

When rotating the Direct Line secret or other credentials:

1. Update `/etc/caddy/env.d/agent.env` with the new value.
2. Reload the service:

```bash
sudo systemctl reload caddy
```

3. Verify the new secret is active by requesting a Direct Line token and checking it is accepted by the bot framework.

---

## Multi-Tenant: DNS-01 Challenge Setup

The multi-tenant pattern requires a wildcard certificate obtained via DNS-01 challenge. Install the appropriate Caddy DNS provider plugin at build time:

```bash
# Example using Azure DNS plugin
xcaddy build --with github.com/caddy-dns/azure

# Example using Cloudflare plugin
xcaddy build --with github.com/caddy-dns/cloudflare
```

Add the DNS provider credentials to the environment file. For Azure DNS:

```bash
sudo tee -a /etc/caddy/env.d/agent.env > /dev/null <<'EOF'
AZURE_DNS_TENANT_ID=<azure-tenant-id>
AZURE_DNS_CLIENT_ID=<service-principal-client-id>
DNS_PROVIDER_TOKEN=<service-principal-client-secret>
WILDCARD_DOMAIN=agent.example.com
EOF
```

---

## Azure Front Door Integration (Load Balanced Pattern)

When placing Azure Front Door in front of Caddy:

1. In Azure Front Door, set the origin to the Caddy server IP or FQDN on port 443.
2. Enable HTTPS on the origin group with a valid certificate on Caddy.
3. Add an IP restriction rule in the server firewall to allow only Azure Front Door IP ranges:

```bash
# Azure Front Door service tag covers all Front Door egress IPs.
# Use Azure Firewall or NSG to restrict inbound 443 to AzureFrontDoor.Backend.
```

4. In the Caddyfile, validate the `X-Azure-FDID` header to reject direct-to-origin bypass traffic:

```caddyfile
@not_from_afd {
  not header X-Azure-FDID {$AZURE_FD_ID}
}
handle @not_from_afd {
  respond "Forbidden" 403
}
```

Add `AZURE_FD_ID` to the environment file with the Front Door ID value from the Azure portal.

---

## Operational Runbook

### Check service health

```bash
sudo systemctl status caddy
curl https://${AGENT_DOMAIN}/healthz
```

### View recent access logs

```bash
tail -f /var/log/caddy/access.log | jq .
```

### Check certificate expiry

```bash
echo | openssl s_client -connect ${AGENT_DOMAIN}:443 2>/dev/null | openssl x509 -noout -enddate
```

### Restart after binary upgrade

```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

### Roll back Caddyfile change

Caddy does not maintain automatic rollback. Keep a backup before changes:

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
# After a bad reload:
sudo cp /etc/caddy/Caddyfile.bak /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
