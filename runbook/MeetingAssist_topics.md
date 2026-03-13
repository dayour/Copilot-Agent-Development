# MeetingAssist Custom Topics Documentation

## Overview
This document captures the custom topics configuration for the MeetMaster agent in Copilot Studio as part of the comprehensive audit performed on **June 26, 2025**.

## Environment Details
- **Environment**: <ENVIRONMENT_NAME>
- **Environment ID**: <ENVIRONMENT_ID>
- **Agent**: MeetMaster
- **Agent ID**: <AGENT_ID>
- **Agent Status**: Published and Protected [x]
- **Owner**: [Agent Owner]

## Custom Topics Summary
From the audit, MeetMaster contains **6 Custom Topics** and **9 System Topics** for a total of **15 topics**.

### Custom Topics List:
1. **Goodbye** - 7 days ago
2. **Greeting** - 7 days ago  
3. **Meeting Adaptive Card** - 6 days ago * (Featured Topic)
4. **ProposeSlots** - 6 days ago
5. **Start Over** - 7 days ago
6. **Thank you** - 7 days ago

## Featured Topic: Meeting Adaptive Card

### Topic Configuration
- **Name**: Meeting Adaptive Card
- **Type**: Topic (Custom)
- **Created**: 6 days ago (June 20, 2025)
- **Status**: Enabled [x]
- **Last Modified**: [Agent Owner], 6 days ago
- **Topic ID**: <TOPIC_ID>

### Trigger Configuration
- **Trigger Type**: The agent chooses (By Agent)
- **Trigger Phrases**: 
  - schedule a meeting
  - create a meeting card
  - set up a meeting
  - generate adaptive card for meeting
  - meeting invitation card
  - design a meeting card
  - meeting adaptive card creation
  - build a meeting invite

### Topic Description
"This tool can handle queries like these: schedule a meeting, create a meeting card, set up a meeting, generate adaptive card for meeting, meeting invitation card"

### Flow Structure
The Meeting Adaptive Card topic follows this flow:

#### 1. Trigger Node
- **Type**: Trigger
- **Configuration**: Agent-chosen with natural language triggers
- **Purpose**: Initiates when user requests meeting scheduling assistance

#### 2. First Question Node
- **Type**: Question
- **Modality**: Text
- **Question**: "Please provide the date and time for the meeting."
- **Entity Recognition**: Date and time
- **Variable**: `MeetingDateTime` (datetime type)
- **Purpose**: Captures meeting scheduling information

#### 3. Second Question Node  
- **Type**: Question
- **Modality**: Text
- **Question**: "Please provide the list of attendees."
- **Entity Recognition**: Person name
- **Variable**: `Attendees` (string type)
- **Purpose**: Captures attendee information

#### 4. Additional Nodes
The topic contains additional "Add node" placeholders that would typically include:
- Meeting room question (based on user requirements)
- SendActivity actions with AdaptiveCard templates
- RSVP functionality
- Book Room functionality

### AdaptiveDialog Configuration Structure
Based on the user-provided requirements, the complete topic should include:

```json
{
  "kind": "Microsoft.AdaptiveDialog",
  "id": "<TOPIC_ID>",
  "triggers": [
    {
      "kind": "Microsoft.OnUnknownIntent",
      "actions": [
        {
          "kind": "Microsoft.SendActivity",
          "activity": "I can help you schedule meetings and create meeting cards!"
        }
      ]
    }
  ],
  "autoEndDialog": true,
  "defaultResultProperty": "dialog.result"
}
```

### Expected Complete Flow
1. **Trigger**: Meeting scheduling request detected
2. **Question**: DateTime collection → `MeetingDateTime` variable
3. **Question**: Attendees collection → `Attendees` variable  
4. **Question**: Meeting room preference → `MeetingRoom` variable
5. **SendActivity**: AdaptiveCard with meeting details
6. **Actions**: RSVP and Book Room buttons

### Variables Used
- `MeetingDateTime` (datetime) - Stores the meeting date and time
- `Attendees` (string) - Stores the list of meeting attendees
- `MeetingRoom` (expected string) - Would store meeting room preference

### Integration Notes
This topic is designed to work with:
- **Microsoft Calendar integration** (via Tools/Connectors)
- **Meeting room booking systems** 
- **Adaptive Cards framework** for rich UI display
- **RSVP tracking functionality**

## Audit Completion Notes
- **Topic Capture Date**: June 26, 2025, 10:08 AM
- **Browser Session**: Microsoft Edge/Chrome via MCP connection
- **Audit Method**: Live UI interaction following UI-driven workflow requirements
- **Documentation Status**: [x] Complete - Custom topic successfully captured and documented

## File Location
- **Primary Audit Document**: `<ENVIRONMENT_NAME>_agent-audit.md`
- **Custom Topics Documentation**: `customtopics.md` (this file)
- **Workflow Requirements**: `copilot-instructions.md`

---
*This documentation was generated as part of the comprehensive MeetMaster agent audit performed following strict UI-driven workflow requirements. No scripts were generated or modified during this process.*
