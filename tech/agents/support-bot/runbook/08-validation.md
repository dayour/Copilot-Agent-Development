# Post-Configuration Validation

> Sweep all configuration pages to verify every setting persisted correctly after the full runbook execution.

## Prerequisites

- All previous runbook steps (01 through 07) have been executed
- Browser is authenticated and on the SupportBot management page
- No other user is concurrently editing SupportBot settings

## Steps

### STEP 1: Validate Generative AI Settings

#### Step 1a: Navigate to Generative AI

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advancedSettings`

**Expected Result**: Generative AI settings page loads.

#### Step 1b: Capture and Verify

**Tool**: `browser_snapshot`

**Verify**:
- [ ] Generative AI orchestration is ON
- [ ] Primary response model is GPT-4o
- [ ] Content moderation is set to High
- [ ] User feedback collection is ON
- [ ] General knowledge is ON
- [ ] Tenant graph grounding is ON

#### Step 1c: Scroll to Connected Agents

**Tool**: `browser_scroll`
**Parameters**:
- deltaY: 500

#### Step 1d: Verify Connected Agents

**Tool**: `browser_snapshot`

**Verify**:
- [ ] Connected agents toggle is ON ("Let other agents connect to and use this one")

WARNING: If the connected agents toggle is OFF, re-run 03-connected-agents.md immediately.

---

### STEP 2: Validate Security Settings

#### Step 2a: Navigate to Security

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/security`

**Expected Result**: Security settings page loads.

#### Step 2b: Capture and Verify

**Tool**: `browser_snapshot`

**Verify**:
- [ ] Skill allowlist is enabled
- [ ] Authentication method is configured
- [ ] No security warnings present

#### Step 2c: Scroll for Full View (if needed)

**Tool**: `browser_scroll`
**Parameters**:
- deltaY: 400

#### Step 2d: Additional Security Checks

**Tool**: `browser_snapshot`

**Verify**:
- [ ] Web channel security is reviewed
- [ ] No unauthorized access configurations

---

### STEP 3: Validate Skills

#### Step 3a: Navigate to Skills

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/skills`

**Expected Result**: Skills page loads.

#### Step 3b: Capture and Verify

**Tool**: `browser_snapshot`

**Verify**:
- [ ] WarrantyGuard is listed as a connected skill
- [ ] Skill status shows connected/active
- [ ] No error indicators on any skill entry

WARNING: If WarrantyGuard is not listed, re-run 05-skills-management.md.

---

### STEP 4: Validate Advanced Settings

#### Step 4a: Navigate to Advanced

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advanced`

**Expected Result**: Advanced settings page loads.

#### Step 4b: Capture and Verify

**Tool**: `browser_snapshot`

**Verify**:
- [ ] Application Insights telemetry is enabled (or environment-level noted)
- [ ] Enhanced Dataverse transcripts are enabled
- [ ] Bot ID: 276dcc5a-3d47-f011-877a-7c1e52698560
- [ ] Environment ID: e2bd2cb1-3e05-e886-81d2-16aa081a3e04
- [ ] External agent calling is configured (if available)

---

### STEP 5: Generate Validation Summary

After completing all verification steps above, compile the results into a summary.

**Validation Checklist**:

```
SupportBot Configuration Validation Summary
============================================
Environment: DYdev26
Bot ID:      276dcc5a-3d47-f011-877a-7c1e52698560
Date:        [current date]

GENERATIVE AI SETTINGS
  Orchestration:        [PASS/FAIL]
  Model (GPT-4o):       [PASS/FAIL]
  Content Moderation:   [PASS/FAIL]
  User Feedback:        [PASS/FAIL]
  General Knowledge:    [PASS/FAIL]
  Tenant Graph:         [PASS/FAIL]

CONNECTED AGENTS
  Toggle Enabled:       [PASS/FAIL]

SECURITY
  Skill Allowlist:      [PASS/FAIL]
  Authentication:       [PASS/FAIL]

SKILLS
  WarrantyGuard Added:  [PASS/FAIL]
  Skill Status Active:  [PASS/FAIL]

ADVANCED
  App Insights:         [PASS/FAIL]
  Transcripts:          [PASS/FAIL]
  Metadata Verified:    [PASS/FAIL]

OVERALL STATUS:         [ALL PASS / ISSUES FOUND]
```

NOTE: Replace [PASS/FAIL] with actual results from each verification step. If any item shows FAIL, reference the corresponding runbook file to re-apply that configuration.

## Verification

This file IS the verification step. If all items above show PASS, the SupportBot configuration is complete and ready for testing.

## Rollback

If validation reveals issues:
1. Identify which settings failed validation
2. Re-run the specific runbook file for that section:
   - Generative AI issues: re-run `02-generative-ai-settings.md`
   - Connected agents OFF: re-run `03-connected-agents.md`
   - Security issues: re-run `04-security-and-allowlist.md`
   - Missing skills: re-run `05-skills-management.md`
   - Advanced settings: re-run `07-advanced-settings.md`
3. After re-running the fix, re-run this validation file (`08-validation.md`) to confirm
