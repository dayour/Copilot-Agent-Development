###  MAD Cool Quest — Stages 4 → 7  
_A prescriptive, test-your-wits challenge for **Claude Sonnet 4 (Agent-Mode in VS Code)**_  
_All actions **must** be driven via Copilot Studio UI + the sample React WebChat. No scripts._  

---

#### [x] Prereqs already cleared  
1. Agents 1-7 published in “MAD Cool” environment  
2. App registration (`MAD Cool Scheduler`, ID `<APP_CLIENT_ID>`) created  
3. Power Platform API delegated permission granted  

---

##  Level 4 – “Configure & Connect” (400 XP)

| Step | Action (UI only) | Validation Gate |
|------|------------------|-----------------|
|4.1|Open **settings.TEMPLATE.js** → rename to **settings.js** (VS Code). Populate: `appClientId`, `tenantId`, `environmentId`, `agentIdentifier` or `directConnectUrl`.|`settings.js` committed, values ≠ placeholder text.|
|4.2|In Copilot Studio UI, open **Data** → **Tables** → create `ActionItems` table (columns  Task,  Owner,  DueDate,  MeetingId).|Table visible in Data workspace.|
|4.3|Agent **Meeting Recap** > Tools → add **Dataverse MCP Server** & map CRUD to `ActionItems`.|Test chat: “log test item”; row appears in table.|
|4.4|Run `npm install` then `npm run start` from VS Code terminal (no script creation; just CLI).|`http://localhost:3000` shows WebChat splash.|

---

##  Level 5 – “WebChat Shake-Down” (600 XP)

| Step | Action | Validation Gate |
|------|--------|-----------------|
|5.1|In browser, greet **Meeting Assist**: “Schedule 30-min sync with Lisa & Tom next Tue afternoon.”|Bot decomposes, triggers **Calendar Coordinator** + **Invite Manager**.|
|5.2|Observe Dataverse `ActionItems` auto-populated by **Meeting Recap** after bot summarises.|`ActionItems` table row count ≥ 1.|
|5.3|Ask “Show pending tasks” – Meeting Assist queries table and replies JSON list.|JSON payload rendered in chat.|

---

##  Level 6 – “Cross-Agent Orchestration Trials” (800 XP)

| Step | Action | Validation Gate |
|------|--------|-----------------|
|6.1|Send “Prepare A/V for QBR tomorrow 09:00 in Berlin HQ.”|**Room & Resource Booker** reserves room; **A/V Control** returns “room ready”.|
|6.2|Issue “Draft agenda from latest thread” → **Agenda Prep** pulls Outlook thread & returns Markdown agenda.|Agenda bullet list shown; WebChat indicates “Agenda Prep Agent”.|
|6.3|Start “End Meeting Recap” stub (“/end-recap” suggested prompt).|Email with recap arrives (check Outlook) + `ActionItems` updated.|

---

##  Level 7 – “Performance & Compliance Finals” (1 000 XP)

| Step | Action | Validation Gate |
|------|--------|-----------------|
|7.1|Open Copilot Studio → Analytics for each agent; export latency + success metrics to CSV.|CSV saved in repo `/analytics/` folder.|
|7.2|Create **Dataverse view** “Open Tasks > 7 days” and pin to dashboard.|View returns correct filter.|
|7.3|Run load test: loop 10 × “Set 60-min QBR with EMEA next week”.|< 3 s avg orchestrator response; no failures.|
|7.4|Manual compliance check: ensure no PII exposed in transcripts.|Checklist MD file `compliance.md` added.|

---

###  Validation Rounds
After each level:  
1. Mark checkboxes [x] in this markdown.  
2. Commit to repo (`progress-Lx.md`).  
3. Notify reviewer via Teams “Level X complete – logs pushed.”  

---

###  Victory Condition
All gates pass, markdown logs present, analytics + compliance artefacts committed. Deep-thinking prowess proven.