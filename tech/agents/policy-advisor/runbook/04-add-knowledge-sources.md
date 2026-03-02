# Add Knowledge Sources

> Add public website and SharePoint policy libraries as knowledge sources for the Policy Advisor agent.

## Prerequisites

- Runbook 03-set-instructions.md completed successfully
- Agent overview page is loaded with instructions confirmed
- SharePoint sites for HR and Legal policy libraries are provisioned and accessible
- URLs for knowledge sources are confirmed:
  - Public website: https://company.example.com (replace with actual URL)
  - HR Policy Library: https://contoso.sharepoint.com/sites/hr-policies (replace with actual URL)
  - Legal Compliance: https://contoso.sharepoint.com/sites/legal-compliance (replace with actual URL)

## Steps

### Step 1: Navigate to Knowledge Section

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent configuration page is visible.
**Verify**: Look for a "Knowledge" tab or section in the navigation.

---

### Step 2: Click Knowledge Tab

**Tool**: `browser_click`
**Parameters**:
- element: "Knowledge tab in the agent configuration navigation"
- ref: (obtain from snapshot -- look for "Knowledge" tab or link)

**Expected Result**: The Knowledge management page loads showing any existing knowledge sources.
**Verify**: An "Add knowledge" or "+ Add knowledge" button is visible.

NOTE: If Knowledge is a section on the Overview page rather than a separate tab, scroll to the Knowledge section instead.

---

### Step 3: Click Add Knowledge

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: (obtain from snapshot -- look for "+ Add knowledge" or "Add knowledge" button)

**Expected Result**: The Add Knowledge dialog or panel opens with source type options.
**Verify**: Options for adding different knowledge source types are visible (e.g., Public website, SharePoint, Dataverse, Files).

---

### Step 4: Select Public Website Source Type

**Tool**: `browser_click`
**Parameters**:
- element: "Public website option in the knowledge source type selector"
- ref: (obtain from snapshot -- look for "Public website" or "Website" option)

**Expected Result**: The website URL input form is displayed.
**Verify**: A URL input field is visible.

---

### Step 5: Enter Public Website URL

**Tool**: `browser_type`
**Parameters**:
- element: "Website URL input field"
- ref: (obtain from snapshot -- look for the URL text input)
- text: `https://company.example.com`

**Expected Result**: The URL is entered in the field.
**Verify**: The field contains the full URL.

WARNING: Replace https://company.example.com with the actual company website URL before execution.

---

### Step 6: Set Website Knowledge Source Name

**Tool**: `browser_type`
**Parameters**:
- element: "Knowledge source name input field"
- ref: (obtain from snapshot -- look for a "Name" or "Display name" input)
- text: `Company Website`

**Expected Result**: The name field shows "Company Website".
**Verify**: Snapshot confirms the name is entered.

NOTE: This field may not appear until after the URL is validated. If no name field is shown, proceed to Step 7.

---

### Step 7: Set Website Description

**Tool**: `browser_type`
**Parameters**:
- element: "Knowledge source description input field"
- ref: (obtain from snapshot -- look for a "Description" textarea)
- text: `Public company website for general information and policies`

**Expected Result**: The description field shows the entered text.
**Verify**: Snapshot confirms the description is entered.

NOTE: Descriptions may be configurable later in runbook 05-knowledge-descriptions.md. If no description field is shown at this stage, skip to Step 8.

---

### Step 8: Add Website to Agent

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button or confirmation button"
- ref: (obtain from snapshot -- look for "Add to agent", "Add", or "Save" button)

**Expected Result**: The public website knowledge source is added to the agent.
**Verify**: The Knowledge list now shows "Company Website" as an entry.

---

### Step 9: Verify Website Knowledge Source Added

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Knowledge page shows the Company Website source in the list.
**Verify**: "Company Website" appears with its URL and any status indicators (e.g., "Active", "Syncing").

---

### Step 10: Enable Web Search Toggle

**Tool**: `browser_snapshot`
**Parameters**: (none)

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Web Search toggle or checkbox"
- ref: (obtain from snapshot -- look for a "Web Search", "Allow web search", or "Search the web" toggle)

**Expected Result**: Web Search is enabled for the agent.
**Verify**: The toggle is in the ON/enabled state.

NOTE: If Web Search is already enabled, skip the click action.

---

### Step 11: Verify Web Search Enabled

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Web Search toggle shows as enabled.
**Verify**: The toggle or checkbox indicates web search is active.

---

### Step 12: Add SharePoint Knowledge Source -- HR Policy Library

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: (obtain from snapshot -- look for "+ Add knowledge" button)

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "SharePoint option in the knowledge source type selector"
- ref: (obtain from snapshot -- look for "SharePoint" option)

Then:

**Tool**: `browser_type`
**Parameters**:
- element: "SharePoint URL input field"
- ref: (obtain from snapshot -- look for the URL or site input)
- text: `https://contoso.sharepoint.com/sites/hr-policies`

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button"
- ref: (obtain from snapshot)

**Expected Result**: HR Policy Library SharePoint source is added.
**Verify**: Knowledge list includes the SharePoint HR policies source.

WARNING: Replace https://contoso.sharepoint.com/sites/hr-policies with the actual SharePoint site URL before execution.

---

### Step 13: Add SharePoint Knowledge Source -- Legal Compliance Library

**Tool**: `browser_click`
**Parameters**:
- element: "Add knowledge button"
- ref: (obtain from snapshot -- look for "+ Add knowledge" button)

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "SharePoint option in the knowledge source type selector"
- ref: (obtain from snapshot -- look for "SharePoint" option)

Then:

**Tool**: `browser_type`
**Parameters**:
- element: "SharePoint URL input field"
- ref: (obtain from snapshot -- look for the URL or site input)
- text: `https://contoso.sharepoint.com/sites/legal-compliance`

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent button"
- ref: (obtain from snapshot)

**Expected Result**: Legal Compliance SharePoint source is added.
**Verify**: Knowledge list includes the SharePoint legal compliance source.

WARNING: Replace https://contoso.sharepoint.com/sites/legal-compliance with the actual SharePoint site URL before execution.

---

### Step 14: Final Knowledge Source Verification

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Knowledge page lists all three knowledge sources:
1. Company Website (public website)
2. HR Policy Library (SharePoint)
3. Legal Compliance (SharePoint)

**Verify**: All three sources appear with status indicators. Web Search toggle is enabled.

## Verification

- Three knowledge sources are listed on the Knowledge page
- Company Website shows the correct URL
- HR Policy Library SharePoint source is connected
- Legal Compliance SharePoint source is connected
- Web Search toggle is enabled
- No error states or sync failures on any source

## Rollback

1. Navigate to the Knowledge page
2. Click the overflow menu (three-dot menu) on each knowledge source to remove
3. Confirm deletion for each source
4. Re-execute this runbook from Step 1
