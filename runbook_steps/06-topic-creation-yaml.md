# Topic Creation via YAML Code Editor

> Create a new topic in a Copilot Studio agent by opening the code editor, pasting a validated YAML topic definition, and saving. This is the most reliable method for deploying topic definitions from source control.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent exists and is in an editable state
- YAML topic definition has been validated (correct schema, minimum 4 trigger phrases)
- Topic YAML is available in the clipboard or a local file

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[TOPIC_NAME]` | Display name for the topic |
| `[TOPIC_YAML]` | Full YAML content of the topic definition |

## YAML Topic Schema Reference

A minimal valid topic YAML:

```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRecognizedIntent
  id: main
  intent:
    displayName: [TOPIC_NAME]
    triggerQueries:
      - [trigger phrase 1]
      - [trigger phrase 2]
      - [trigger phrase 3]
      - [trigger phrase 4]
  actions:
    - kind: SendActivity
      id: response1
      activity:
        text:
          values:
            - value: "[Initial response text]"
```

Ensure at least 4 trigger phrases are present. The `displayName` must match `[TOPIC_NAME]` exactly.

---

## Steps

### Step 1: Navigate to Topics Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/topics`

**Expected Result**: The Topics management page loads.

---

### Step 2: Capture Topics Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Topics page is visible with an "Add a topic" or "New topic" button present. The existing topic list is shown.

---

### Step 3: Click Add a Topic

**Tool**: `browser_click`
**Parameters**:
- element: "Add a topic or New topic button on the Topics page"
- ref: `[from snapshot]`

**Expected Result**: Topic creation options or a blank topic editor opens.

[VERIFY] Options such as "From blank", "From a description (AI-suggested)", or "With YAML code editor" may appear.

---

### Step 4: Select Code Editor or From Blank [SNAPSHOT]

**Tool**: `browser_snapshot`

If a menu appeared after Step 3, look for a code editor option:

**Tool**: `browser_click`
**Parameters**:
- element: "From blank option or code editor topic creation option"
- ref: `[from snapshot]`

**Expected Result**: A new blank topic opens, showing either a visual canvas or the code editor.

NOTE: If the visual canvas opens by default, proceed to Step 5 to switch to the code editor. If the code editor is already shown, skip to Step 7.

---

### Step 5: Switch to Code Editor [SNAPSHOT]

**Tool**: `browser_snapshot`

Look for a "Code editor", "</>" toggle, or "Edit in code" button in the topic editor toolbar.

**Tool**: `browser_click`
**Parameters**:
- element: "Code editor toggle or Edit in code button in the topic editor"
- ref: `[from snapshot]`

**Expected Result**: The visual canvas is replaced by a YAML code editor.

[VERIFY] A text area with YAML syntax is visible. The editor may show a default YAML scaffold.

---

### Step 6: Select All Existing YAML in Editor [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "YAML code editor text area"
- ref: `[from snapshot]`

**Tool**: `browser_press_key`
**Parameters**:
- key: "Control+a"

**Expected Result**: All existing YAML text in the editor is selected.

---

### Step 7: Paste the Topic YAML

**Tool**: `browser_type`
**Parameters**:
- element: "YAML code editor text area"
- ref: `[from snapshot]`
- text: `[TOPIC_YAML]`
- slowly: false

**Expected Result**: The YAML code editor now contains `[TOPIC_YAML]`.

[VERIFY] Scroll through the editor to confirm the full YAML is present, including the `triggerQueries` array and all action nodes.

---

### Step 8: Validate YAML (Check for Errors) [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] No red error markers, underlines, or error banners are visible in the code editor. If errors appear:

1. Review the error message text
2. Correct the YAML (indentation, missing fields, or invalid values)
3. Re-paste the corrected YAML from Step 6
4. Take a fresh snapshot to confirm errors are cleared

---

### Step 9: Save the Topic [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the topic editor"
- ref: `[from snapshot]`

**Expected Result**: The topic is saved and the editor shows a success indicator or transitions to a saved state.

[VERIFY] A "Saved", checkmark, or equivalent indicator is visible. The topic name `[TOPIC_NAME]` appears in the editor header or breadcrumb.

---

### Step 10: Navigate Back to Topics List [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/topics`

**Tool**: `browser_snapshot`

[VERIFY] The new topic `[TOPIC_NAME]` appears in the Topics list. Confirm it is in an active (enabled) state.

---

### Step 11: Open Topic to Confirm Trigger Phrases [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Topic row for [TOPIC_NAME] in the topics list"
- ref: `[from snapshot]`

**Tool**: `browser_snapshot`

[VERIFY] The topic editor shows the trigger phrases from the YAML. Confirm at least 4 trigger phrases are present.

---

## Verification

- Topic `[TOPIC_NAME]` appears in the Topics list
- Topic is in enabled/active state
- Trigger phrases match the YAML definition
- No syntax errors in the code editor
- No validation warnings on the topic

## Rollback

1. Navigate to the Topics page
2. Locate `[TOPIC_NAME]` in the list
3. Open the three-dot overflow menu on the topic row
4. Select "Delete" and confirm
5. Verify the topic is removed from the list

## Troubleshooting

| Issue | Resolution |
|---|---|
| YAML save fails with schema error | Validate the YAML against the Copilot Studio topic schema. Ensure `kind: AdaptiveDialog` is the root node |
| Trigger phrases not recognized | Verify the `triggerQueries` array has at least 4 distinct phrases |
| Code editor not switching from visual canvas | Use the keyboard shortcut `Ctrl+Shift+E` or look for a toolbar icon with "</>" label |
| Topic saved but not appearing in list | Refresh the Topics page with `browser_navigate` back to the topics URL |
