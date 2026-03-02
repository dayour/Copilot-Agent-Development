# Settings Sitemap — SupportBot (Tech)

Configuration reference for the SupportBot agent in Copilot Studio. Each section maps to a settings page in the management portal with current values, recommended actions, and direct URLs.

**Environment:** DYdev26
**Environment ID:** e2bd2cb1-3e05-e886-81d2-16aa081a3e04
**Bot ID:** 276dcc5a-3d47-f011-877a-7c1e52698560
**URL Base:** https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/

---

## 1. Generative AI

**URL:** [/advancedSettings](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advancedSettings)

### 1.1 Orchestration

| Setting | Current Value | Notes |
|---------|--------------|-------|
| Generative AI orchestration | ON | Primary orchestration mode |
| Classic orchestration | OFF | Disabled in favour of gen AI |
| Deep reasoning | OFF | Not required for current use case |

### 1.2 Connected Agents

| Setting | Current Value | Required Value |
|---------|--------------|----------------|
| Connected agents | OFF | ON |

CRITICAL: Connected agents must be enabled for multi-agent orchestration. This is required before WarrantyGuard can be invoked as a connected agent.

### 1.3 Responses

| Setting | Current Value | Notes |
|---------|--------------|-------|
| Model | GPT-4o | Current generation model |
| Formatting instructions | (empty) | Needs configuration — add orchestration-specific instructions |

NOTE: Add formatting instructions that guide the model on when to route to WarrantyGuard versus handling inline. Include tone, escalation triggers, and response structure guidance.

### 1.4 Moderation

| Setting | Current Value |
|---------|--------------|
| Content moderation level | High (3/5) |

### 1.5 User Feedback

| Setting | Current Value |
|---------|--------------|
| User feedback | ON |

### 1.6 Knowledge

| Setting | Current Value |
|---------|--------------|
| General knowledge | ON |
| Web search | OFF |

### 1.7 File Processing

| Setting | Current Value |
|---------|--------------|
| Image processing | ON |

### 1.8 Search

| Setting | Current Value |
|---------|--------------|
| Tenant Graph search | ON |

---

## 2. Agent Details

**URL:** [/details](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/details)

| Setting | Current Value | Notes |
|---------|--------------|-------|
| Name | SupportBot | |
| Icon | Default | Consider adding a branded icon |
| Solution | Common Data Services Default Solution | |

---

## 3. Security

**URL:** [/security](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/security)

| Setting | Current Value | Required Value |
|---------|--------------|----------------|
| Authentication | Configured | Verify Entra ID authentication is active |
| Web channel security | Configured | Review token-based security settings |
| Allowlist | Disabled | Enabled |

CRITICAL: The security allowlist must be enabled for multi-agent orchestration. Without it, WarrantyGuard cannot be registered as an allowed connected agent or skill.

---

## 4. Connection Settings

**URL:** [/connectionSettings](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/connectionSettings)

STATUS: Requires exploration. Document connector configurations, OAuth settings, and API connections once reviewed.

---

## 5. Authoring Canvas

**URL:** [/canvasSettings](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/canvasSettings)

STATUS: Requires exploration. Document topic authoring defaults and canvas behaviour settings once reviewed.

---

## 6. Entities

**URL:** [/entities](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/entities)

STATUS: Requires exploration. Document custom entities, slot-filling configurations, and entity extraction settings once reviewed.

---

## 7. Skills

**URL:** [/skills](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/skills)

CRITICAL: This section is essential for multi-agent orchestration.

| Action | Status | Details |
|--------|--------|---------|
| Add WarrantyGuard as skill | Pending | Register WarrantyGuard agent endpoint as a skill |
| Configure skill allowlist | Pending | Ensure WarrantyGuard is on the security allowlist |
| Test skill invocation | Pending | Validate end-to-end handoff from SupportBot to WarrantyGuard |

WARNING: Skills will not function unless the security allowlist (Section 3) is enabled and the target agent is registered.

---

## 8. Voice

**URL:** [/voiceSettings](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/voiceSettings)

STATUS: Requires exploration. Document voice channel configuration and SSML settings once reviewed.

---

## 9. Languages

**URL:** [/multiLanguage](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/multiLanguage)

STATUS: Requires exploration. Document supported languages and localisation settings once reviewed.

---

## 10. Language Understanding

**URL:** [/languageSettings](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/languageSettings)

STATUS: Requires exploration. Document NLU model settings, training configuration, and intent recognition thresholds once reviewed.

---

## 11. Component Collections

**URL:** [/componentCollections](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/componentCollections)

STATUS: Requires exploration. Document reusable component collections and shared topic libraries once reviewed.

---

## 12. Advanced

**URL:** [/advanced](https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advanced)

| Setting | Status | Notes |
|---------|--------|-------|
| Application Insights | Pending setup | Required for production monitoring and multi-agent tracing |
| Custom events | Requires exploration | Document custom telemetry events |
| Enhanced transcripts | Requires exploration | Document transcript storage configuration |
| Metadata | Requires exploration | Document metadata pass-through settings |
| External scenarios | Requires exploration | Document external scenario integration |

NOTE: Application Insights integration is strongly recommended before production deployment to enable end-to-end tracing across SupportBot and WarrantyGuard.

---

## Critical Actions for Multi-Agent Orchestration

The following actions must be completed to enable SupportBot as a multi-agent orchestrator:

| Priority | Action | Section | Status |
|----------|--------|---------|--------|
| 1 | Enable Connected Agents | 1. Generative AI | Pending |
| 2 | Add WarrantyGuard as Skill | 7. Skills | Pending |
| 3 | Enable Security Allowlist | 3. Security | Pending |
| 4 | Configure Response Formatting | 1. Generative AI | Pending |
| 5 | Enable Application Insights | 12. Advanced | Pending |

WARNING: Multi-agent orchestration will not function until items 1, 2, and 3 are completed. Items 4 and 5 are strongly recommended for production readiness.

---

## Configuration Checklist

- [ ] Generative AI orchestration is ON
- [ ] Connected agents is ON
- [ ] WarrantyGuard is added as a skill
- [ ] Security allowlist is enabled and WarrantyGuard is listed
- [ ] Response formatting instructions are configured
- [ ] Content moderation level is reviewed and appropriate
- [ ] User feedback is enabled
- [ ] Authentication is configured with Entra ID
- [ ] Application Insights is connected
- [ ] All "requires exploration" sections are documented
- [ ] End-to-end handoff to WarrantyGuard is tested
- [ ] Complex case escalation to human agent is tested
- [ ] Agent is published to target channels (web chat, Teams)
