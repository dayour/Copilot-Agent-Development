# Topic Trigger Phrase Updates

> Modify the trigger phrases for an existing topic in a Copilot Studio agent. Covers both the visual trigger phrase editor and the code editor path.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent and topic exist
- New trigger phrases are prepared (minimum 4 total after update)

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[TOPIC_NAME]` | Display name of the topic to update |
| `[PHRASE_TO_ADD]` | New trigger phrase to add |
| `[PHRASE_TO_REMOVE]` | Existing trigger phrase to remove |

---

## Steps

### Step 1: Navigate to Topics Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/topics`

**Expected Result**: Topics list loads.

---

### Step 2: Capture Topics List [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Topics list is visible and `[TOPIC_NAME]` appears in the list.

---

### Step 3: Open the Target Topic

**Tool**: `browser_click`
**Parameters**:
- element: "Topic row for [TOPIC_NAME]"
- ref: `[from snapshot]`

**Expected Result**: The topic editor opens, showing either the visual canvas or the code editor.

---

### Step 4: Navigate to Trigger Phrases Section [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The topic editor is visible. Look for a "Trigger phrases", "Phrases", or "Intent" section. In the visual editor, this is usually the first node on the canvas labeled "Phrases" or "Trigger". In the code editor, look for the `triggerQueries` key.

---

## Path A: Visual Editor (Trigger Phrases Panel)

### Step 5A: Click on the Trigger Phrases Node

**Tool**: `browser_click`
**Parameters**:
- element: "Trigger phrases node or Phrases node on the topic canvas"
- ref: `[from snapshot]`

**Expected Result**: A trigger phrases panel or edit dialog opens showing the current phrases.

[VERIFY] Existing trigger phrases are listed. Count confirms the current total.

---

### Step 6A: Add a New Trigger Phrase [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Add a phrase input field or Enter a phrase textbox in the trigger phrases panel"
- ref: `[from snapshot]`

**Tool**: `browser_type`
**Parameters**:
- element: "Add a phrase input field"
- ref: `[from snapshot]`
- text: `[PHRASE_TO_ADD]`
- submit: true

**Expected Result**: `[PHRASE_TO_ADD]` is added to the trigger phrases list.

[VERIFY] The new phrase appears in the list. Total phrase count increased by one.

---

### Step 7A: Remove an Existing Trigger Phrase [SNAPSHOT]

**Tool**: `browser_snapshot`

Locate `[PHRASE_TO_REMOVE]` in the trigger phrases list.

**Tool**: `browser_click`
**Parameters**:
- element: "Delete or Remove button next to [PHRASE_TO_REMOVE] in the trigger phrases list"
- ref: `[from snapshot]`

**Expected Result**: `[PHRASE_TO_REMOVE]` is removed from the list.

[VERIFY] The phrase is no longer visible in the list. Total phrase count decreased by one.

---

### Step 8A: Confirm Minimum Phrase Count [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] At least 4 trigger phrases remain in the list. If fewer than 4 exist, add additional phrases before saving.

---

### Step 9A: Save the Topic [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the topic editor"
- ref: `[from snapshot]`

[VERIFY] Save confirmation is visible. No error banners.

---

## Path B: Code Editor (YAML Trigger Phrases)

### Step 5B: Switch to Code Editor [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Code editor toggle or Edit in code button in the topic editor"
- ref: `[from snapshot]`

[VERIFY] YAML code editor is visible with the `triggerQueries` array present.

---

### Step 6B: Locate triggerQueries in YAML

**Tool**: `browser_snapshot`

Identify the `triggerQueries` section of the YAML. The current phrases are listed as array items.

---

### Step 7B: Edit YAML to Update Trigger Phrases

Select the `triggerQueries` section and update the array:

**Tool**: `browser_click`
**Parameters**:
- element: "YAML code editor text area"
- ref: `[from snapshot]`

Use keyboard navigation to place the cursor on the line to edit, then type the updated content. Alternatively, select all and replace with the complete updated YAML.

[VERIFY] After editing, the `triggerQueries` array contains the desired phrases with at least 4 entries.

---

### Step 8B: Save the Topic [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the topic editor"
- ref: `[from snapshot]`

[VERIFY] Save confirmation is visible. YAML is syntactically valid (no error markers).

---

## Post-Update Verification

### Step 10: Reload Topic and Confirm Phrases [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/topics`

**Tool**: `browser_click`
**Parameters**:
- element: "Topic row for [TOPIC_NAME]"
- ref: `[from snapshot]`

**Tool**: `browser_snapshot`

[VERIFY]
- `[PHRASE_TO_ADD]` is present in the trigger phrases
- `[PHRASE_TO_REMOVE]` is absent from the trigger phrases
- At least 4 trigger phrases remain

---

## Verification

- Updated trigger phrases are saved and visible after page reload
- Minimum of 4 trigger phrases are present
- No validation warnings on the topic
- Topic is still in enabled state

## Rollback

1. Open the topic in the editor
2. Add back any removed phrases or remove any incorrectly added phrases
3. Save the topic
4. Verify the phrases match the intended state

## Routing Notes

In generative orchestration mode, the topic's description field is the primary routing signal, not the trigger phrases. Trigger phrases function as exact-match fallbacks and training signals. Always update both the trigger phrases and the topic description when changing a topic's intent scope.
