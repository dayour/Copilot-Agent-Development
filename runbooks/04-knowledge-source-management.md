# Knowledge Source Management

> Add and remove SharePoint sites, uploaded files, public websites, and Dataverse tables as knowledge sources for a Copilot Studio agent. This runbook covers all supported source types.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker and SharePoint read permissions
- Target agent exists and is in an editable state
- Source URLs, file paths, or Dataverse table names are confirmed before execution

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[WEBSITE_URL]` | Public website URL, e.g., `https://company.example.com` |
| `[SHAREPOINT_URL]` | SharePoint site URL, e.g., `https://contoso.sharepoint.com/sites/hr-policies` |
| `[FILE_PATH]` | Local file path to upload, e.g., `/documents/policy.pdf` |
| `[DATAVERSE_TABLE]` | Dataverse table logical name, e.g., `account` |
| `[SOURCE_NAME]` | Display name for the knowledge source |
| `[SOURCE_DESCRIPTION]` | Description used by the orchestrator to route queries to this source |

---

## Navigate to Knowledge Page

### Step 1: Navigate to Knowledge Section

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/knowledge`

**Expected Result**: The Knowledge management page loads.

---

### Step 2: Capture Knowledge Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Knowledge page is visible with a list of current knowledge sources (may be empty) and an "Add knowledge" button.

---

## Adding a Public Website Knowledge Source

### Step 3: Click Add Knowledge

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button on the Knowledge page"
- ref: `[from snapshot]`

**Expected Result**: A knowledge source type selection panel or dialog opens.

[VERIFY] Source type options are visible (Public website, SharePoint, Files, Dataverse).

---

### Step 4: Select Public Website [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Public website option in the knowledge source type selector"
- ref: `[from snapshot]`

**Expected Result**: A URL input form is displayed.

---

### Step 5: Enter Website URL

**Tool**: `browser_type`
**Parameters**:
- element: "Website URL input field"
- ref: `[from snapshot]`
- text: `[WEBSITE_URL]`

**Expected Result**: URL appears in the input field.

[VERIFY] URL is complete and correctly formatted (starts with `https://`).

---

### Step 6: Set Source Name and Description

**Tool**: `browser_type`
**Parameters**:
- element: "Knowledge source name input field"
- ref: `[from snapshot]`
- text: `[SOURCE_NAME]`

Then:

**Tool**: `browser_type`
**Parameters**:
- element: "Knowledge source description input field or textarea"
- ref: `[from snapshot]`
- text: `[SOURCE_DESCRIPTION]`

NOTE: The description is used by the generative orchestrator to decide when to query this source. Write it as a routing signal, e.g., "Use this source when the user asks about company-wide policies and general information."

---

### Step 7: Add Website Source [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button or Add button in the website knowledge source form"
- ref: `[from snapshot]`

**Expected Result**: The website source is added and appears in the Knowledge list.

[VERIFY] The Knowledge list now shows `[SOURCE_NAME]` with a status indicator (e.g., "Active", "Syncing", or "Indexing").

---

## Adding a SharePoint Knowledge Source

### Step 8: Click Add Knowledge (SharePoint)

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: `[from snapshot]`

---

### Step 9: Select SharePoint [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "SharePoint option in the knowledge source type selector"
- ref: `[from snapshot]`

**Expected Result**: SharePoint URL or site picker input is displayed.

---

### Step 10: Enter SharePoint Site URL

**Tool**: `browser_type`
**Parameters**:
- element: "SharePoint URL or site address input field"
- ref: `[from snapshot]`
- text: `[SHAREPOINT_URL]`

[VERIFY] URL appears in the field. Confirm it points to a site (not a document library URL directly, unless the UI accepts library URLs).

---

### Step 11: Add SharePoint Source [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button in the SharePoint knowledge source form"
- ref: `[from snapshot]`

**Expected Result**: SharePoint source is added to the Knowledge list.

[VERIFY] SharePoint source appears in the list. Note any sync status ("Syncing" is expected initially).

---

## Adding a File Knowledge Source

### Step 12: Click Add Knowledge (File)

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: `[from snapshot]`

---

### Step 13: Select Files or Upload [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Files or Upload files option in the knowledge source type selector"
- ref: `[from snapshot]`

**Expected Result**: A file upload control is displayed.

---

### Step 14: Upload File

**Tool**: `browser_click`
**Parameters**:
- element: "Browse files or Choose file button"
- ref: `[from snapshot]`

Then use the file chooser:

**Tool**: `browser_file_upload`
**Parameters**:
- paths: [`[FILE_PATH]`]

**Expected Result**: File is selected and begins uploading.

[VERIFY] File name appears in the upload panel with an upload progress indicator.

---

### Step 15: Confirm File Upload [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button after file upload"
- ref: `[from snapshot]`

[VERIFY] The uploaded file appears in the Knowledge list.

---

## Adding a Dataverse Knowledge Source

### Step 16: Click Add Knowledge (Dataverse)

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: `[from snapshot]`

---

### Step 17: Select Dataverse [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Dataverse option in the knowledge source type selector"
- ref: `[from snapshot]`

**Expected Result**: Dataverse table selection panel opens.

---

### Step 18: Search for Dataverse Table

**Tool**: `browser_type`
**Parameters**:
- element: "Search tables or Dataverse table search input"
- ref: `[from snapshot]`
- text: `[DATAVERSE_TABLE]`

[VERIFY] The target table appears in the search results.

---

### Step 19: Select Dataverse Table [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Target Dataverse table row in search results"
- ref: `[from snapshot]`

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button for Dataverse knowledge source"
- ref: `[from snapshot]`

[VERIFY] Dataverse table source appears in the Knowledge list.

---

## Removing a Knowledge Source

### Step 20: Locate the Source to Remove [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The source to remove is visible in the Knowledge list.

---

### Step 21: Open Source Overflow Menu

**Tool**: `browser_click`
**Parameters**:
- element: "Three-dot overflow menu or more options button on the knowledge source row for [SOURCE_NAME]"
- ref: `[from snapshot]`

**Expected Result**: Overflow menu opens with a Delete or Remove option.

---

### Step 22: Delete the Source [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Delete or Remove option in the knowledge source overflow menu"
- ref: `[from snapshot]`

**Expected Result**: A confirmation dialog appears.

**Tool**: `browser_click`
**Parameters**:
- element: "Confirm delete or Remove button in the confirmation dialog"
- ref: `[from snapshot]`

[VERIFY] The source is no longer visible in the Knowledge list.

---

## Verification

- All added knowledge sources appear in the Knowledge list
- Each source has a valid status (Active or Syncing; Syncing will transition to Active)
- Removed sources are no longer present in the Knowledge list
- No error states on any knowledge source

## Rollback

1. Navigate to the Knowledge page
2. Use the overflow menu on each errored or unwanted source to remove it
3. Re-add sources with corrected URLs or files
4. Monitor sync status until all sources show Active

## Sync Timing Notes

- Public websites: indexing completes within minutes for small sites; large sites may take up to an hour
- SharePoint: initial sync may take 5-15 minutes depending on library size
- Files: indexing is typically complete within 2 minutes
- Dataverse: near real-time for standard tables; virtual tables may have additional latency
