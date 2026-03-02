# Publishing and Channel Deployment Guide

## Overview
Copilot Studio agents can be published to multiple channels simultaneously. This guide covers every channel used across the 5 verticals in this repository, with step-by-step deployment instructions.

## Channel Matrix
| Channel | Auth Model | Verticals Using | Audience | Branding Options |
|---|---|---|---|---|
| Microsoft Teams | Azure AD SSO | All 5 | Internal employees | Bot icon, display name, description |
| Web Chat (Internal) | Azure AD redirect | Clothing, Insurance, Tech | Internal portal users | Full CSS customization |
| Web Chat (External) | Azure AD B2C / Anonymous | Insurance, Tech | Customers, prospects | Full CSS customization, pre-chat form |
| Mobile Web | Same as web chat | Coffee, Transportation | Field workers, drivers | Responsive design, simplified UI |
| Power Apps | Inherited auth | Transportation | Mobile app users | Embedded component |

## Microsoft Teams Deployment

### Prerequisites
- Copilot Studio agent published at least once
- Teams admin permission (or admin approval workflow)
- Agent compliance with Teams app store policies (if publishing to org store)

### Step-by-Step
1. In Copilot Studio, navigate to **Channels > Microsoft Teams**.
2. Click **Turn on Teams**.
3. Configure bot metadata:
   1. Display name (for example, "Virtual Coach", "Power Analysis")
   2. Short description (shown in Teams app catalog)
   3. Long description (shown in app details)
   4. Bot icon (96x96 PNG, transparent background)
   5. Accent color (hex code matching brand)
4. Choose availability:
   1. Show in Teams app store for your organization
   2. Pin to specific users/groups via Teams admin policy
   3. Install automatically for specific departments
5. Submit for admin approval (if required by tenant policy).
6. Complete admin approval in **Teams Admin Center > Manage apps**, find the agent, and select **Approve**.
7. Test by opening Teams, searching for the agent in apps, and starting a conversation.

### Teams-Specific Features
- Proactive messaging: agent can send first message (requires Bot Framework setup)
- Adaptive cards: full support in Teams
- File upload: supported via Teams attachment
- Deep links: create direct links to the agent conversation

### Pinning and Auto-Install (Admin)
1. Open **Teams admin center > Setup policies**.
2. Add the agent as a pinned app.
3. Assign policy to specific security groups (for example, all baristas for Coffee, all sales reps for Tech).

## Web Chat Deployment (Internal)

### Step-by-Step
1. In Copilot Studio, navigate to **Channels > Custom website**.
2. Copy the embed code (iframe snippet).
3. Configure authentication with Azure AD redirect for internal users.
4. Configure allowed domains and restrict to approved intranet/portal domains.
5. Embed in SharePoint page, Power Apps portal, or internal web application.
6. Style the chat widget by customizing colors, position, and welcome message using embed parameters.

### SharePoint Embedding (Coffee vertical)
1. Add a Script Editor or Embed web part to the SharePoint page.
2. Paste the Copilot Studio iframe embed code.
3. Configure iframe dimensions based on page layout.
4. Test responsiveness on mobile devices.

### Branding Options
- Bot avatar (URL to hosted image)
- Header background color
- Chat bubble colors (user vs bot)
- Font family override
- Custom CSS injection (advanced)

## Web Chat Deployment (External)

### Step-by-Step
1. In Copilot Studio, navigate to **Channels > Custom website**.
2. Configure authentication:
   1. Option A: Azure AD B2C (Insurance policyholders, Tech prospects)
   2. Option B: No authentication (anonymous chat with optional registration)
3. Configure allowed domains and restrict to your public website domain.
4. Generate embed code.
5. Pass embed package and implementation notes to web development team.
6. Configure optional pre-chat form to collect name, email, and topic before routing.

### Azure AD B2C Integration
1. Configure a B2C user flow with combined sign-up and sign-in.
2. Add identity providers as required (email/password, LinkedIn for Tech, Google).
3. Configure redirect URIs and include Copilot Studio callback URL.
4. Map B2C token claims to agent context variables (display name, email, company).

### Security Hardening for External Channels
1. Rate limiting: configure per-IP and per-session throttling.
2. Abuse prevention: enable CAPTCHA on pre-chat form and apply conversation length limits.
3. CORS: restrict to specific domains using allowed origins.
4. Content safety: enable Azure Content Safety filters.
5. DDoS protection: use Azure Front Door with WAF rules for high-traffic deployments.

### GDPR and Privacy for External Channels
1. Display cookie consent banner before chat widget loads.
2. Include privacy policy link in pre-chat form.
3. Display data processing notice at start of conversation.
4. Implement right-to-erasure process to delete conversation history on request.
5. Configure transcript retention period to align with policy.

## Mobile Web Deployment

### Responsive Design Considerations
- Chat widget should be full-width on mobile viewports
- Adaptive cards should use single-column layout
- File upload UI should work with mobile camera (photo capture)
- Touch targets should be large for quick replies and buttons

### Progressive Web App (PWA) Deployment
1. Target Coffee (baristas) and Transportation (drivers).
2. Wrap web chat in a PWA shell for home screen installation.
3. Configure offline fallback message: "You are offline, please reconnect".
4. Configure push notifications for proactive alerts (maintenance, anomaly, SLA).

## Power Apps Embedding (Transportation)

### Step-by-Step
1. In Power Apps canvas app, add the Copilot Studio component.
2. Configure agent ID and environment.
3. Pass user context from app to agent.
4. Style chat panel within app layout.
5. Test on mobile devices (Power Apps mobile app).

## Post-Publishing Checklist
Checklist applicable to all channels after initial publish:

- [ ] Agent responds to greeting on the new channel
- [ ] Authentication flow completes without errors
- [ ] All topics function correctly on the channel
- [ ] Adaptive cards render properly
- [ ] File upload works (where applicable)
- [ ] Escalation/handoff transfers correctly
- [ ] Fallback topic triggers for unrecognized input
- [ ] Analytics data appears in Copilot Studio conversation analytics

## Updating a Published Agent
- Topic changes: edit in Copilot Studio, click Publish, and changes go live immediately
- Solution updates: re-import updated solution, then re-publish
- Breaking changes: test in staging environment first and schedule a maintenance window
- Communication: notify users via Teams announcement or email before major changes

## Multi-Environment Publishing
- Development: test environment, frequent publishes, limited users
- Staging: pre-production, solution import testing, UAT with business users
- Production: stable, change-controlled, full user base
- Use Power Platform solutions and managed solutions for environment promotion
