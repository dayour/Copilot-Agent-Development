# Configure Knowledge Source Descriptions

> Replace auto-generated descriptions with meaningful text that guides the orchestrator's knowledge source selection.

## Prerequisites

- Runbook 04-add-knowledge-sources.md completed successfully
- All three knowledge sources are added and visible on the Knowledge page:
  1. Company Website
  2. HR Policy Library (SharePoint)
  3. Legal Compliance (SharePoint)

## Why Descriptions Matter

NOTE: Knowledge source descriptions are not just cosmetic labels. The Copilot Studio orchestrator uses these descriptions to determine which knowledge source to query for a given user request. Vague or auto-generated descriptions (e.g., "SharePoint site") cause the orchestrator to either query the wrong source or query all sources unnecessarily, leading to slower responses and less relevant results.

Well-written descriptions should:
- Clearly state what content the source contains
- Use domain-specific terms that match likely user queries
- Differentiate each source from the others so the orchestrator can make precise routing decisions

## Steps

### Step 1: Navigate to Knowledge Tab

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Knowledge page is visible with all three sources listed.
**Verify**: All three knowledge sources are present. If not on the Knowledge page, click the "Knowledge" tab first.

---

### Step 2: Open Company Website Knowledge Source for Editing

**Tool**: `browser_click`
**Parameters**:
- element: "Company Website knowledge source entry or its edit/settings icon"
- ref: (obtain from snapshot -- look for the Company Website row and its edit control)

**Expected Result**: The knowledge source detail or edit panel opens.
**Verify**: A description field is visible and editable.

---

### Step 3: Update Company Website Description

**Tool**: `browser_type`
**Parameters**:
- element: "Description field for Company Website knowledge source"
- ref: (obtain from snapshot -- look for the description textarea)
- text: `Public company website containing product information, general policies, and corporate announcements`

**Expected Result**: The description field contains the updated text.
**Verify**: Full text is entered without truncation.

NOTE: Use Ctrl+A before typing to replace any auto-generated description text.

---

### Step 4: Save Company Website Description

**Tool**: `browser_click`
**Parameters**:
- element: "Save or Done button for the knowledge source edit"
- ref: (obtain from snapshot -- look for "Save", "Done", or "Apply" button)

**Expected Result**: The description is saved and the knowledge source list refreshes.
**Verify**: No unsaved changes indicator is present.

---

### Step 5: Open HR Policy Library Knowledge Source for Editing

**Tool**: `browser_click`
**Parameters**:
- element: "HR Policy Library knowledge source entry or its edit/settings icon"
- ref: (obtain from snapshot -- look for the HR Policy Library row and its edit control)

**Expected Result**: The knowledge source detail or edit panel opens.
**Verify**: A description field is visible and editable.

---

### Step 6: Update HR Policy Library Description

**Tool**: `browser_type`
**Parameters**:
- element: "Description field for HR Policy Library knowledge source"
- ref: (obtain from snapshot -- look for the description textarea)
- text: `Internal HR policy documents including remote work, leave, benefits, workplace accommodations, and employee handbook`

**Expected Result**: The description field contains the updated text.
**Verify**: Full text is entered without truncation.

NOTE: Use Ctrl+A before typing to replace any auto-generated description text.

---

### Step 7: Save HR Policy Library Description

**Tool**: `browser_click`
**Parameters**:
- element: "Save or Done button for the knowledge source edit"
- ref: (obtain from snapshot -- look for "Save", "Done", or "Apply" button)

**Expected Result**: The description is saved.
**Verify**: No unsaved changes indicator is present.

---

### Step 8: Open Legal Compliance Knowledge Source for Editing

**Tool**: `browser_click`
**Parameters**:
- element: "Legal Compliance knowledge source entry or its edit/settings icon"
- ref: (obtain from snapshot -- look for the Legal Compliance row and its edit control)

**Expected Result**: The knowledge source detail or edit panel opens.
**Verify**: A description field is visible and editable.

---

### Step 9: Update Legal Compliance Description

**Tool**: `browser_type`
**Parameters**:
- element: "Description field for Legal Compliance knowledge source"
- ref: (obtain from snapshot -- look for the description textarea)
- text: `Legal compliance documents, regulatory guidelines, and internal legal policies`

**Expected Result**: The description field contains the updated text.
**Verify**: Full text is entered without truncation.

NOTE: Use Ctrl+A before typing to replace any auto-generated description text.

---

### Step 10: Save Legal Compliance Description

**Tool**: `browser_click`
**Parameters**:
- element: "Save or Done button for the knowledge source edit"
- ref: (obtain from snapshot -- look for "Save", "Done", or "Apply" button)

**Expected Result**: The description is saved.
**Verify**: No unsaved changes indicator is present.

---

### Step 11: Verify All Descriptions Updated

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Knowledge page shows all three sources with their updated descriptions.
**Verify**: Confirm each description matches:

| Source | Expected Description |
|---|---|
| Company Website | Public company website containing product information, general policies, and corporate announcements |
| HR Policy Library | Internal HR policy documents including remote work, leave, benefits, workplace accommodations, and employee handbook |
| Legal Compliance | Legal compliance documents, regulatory guidelines, and internal legal policies |

## Verification

- All three knowledge sources have custom descriptions (not auto-generated text)
- Descriptions contain domain-specific terms that differentiate each source
- No auto-generated placeholder text remains
- All changes are saved

## Rollback

1. Open each knowledge source for editing
2. Replace the description with the previous auto-generated text or a corrected version
3. Save each change
