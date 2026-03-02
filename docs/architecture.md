# Architecture and Flow Diagrams

This document is the visual architecture reference for the Copilot-Agent-Development repository. It maps repository topology, the full seven-agent ecosystem, and the most significant runtime and integration flows per vertical, plus cross-cutting delivery and authentication patterns.

## Repository Structure

The following diagram shows the repository root, all five verticals, all seven agents, and the standard four-file scaffold used by each agent. It also includes the shared `docs/` directory.

```mermaid
flowchart TB
    repo["Copilot-Agent-Development (repo root)"]
    docs["docs/"]

    repo --> coffee["coffee/"]
    repo --> clothing["clothing/"]
    repo --> insurance["insurance/"]
    repo --> tech["tech/"]
    repo --> transport["transportation/"]
    repo --> docs

    coffee --> c_agents["agents/"]
    clothing --> cl_agents["agents/"]
    insurance --> i_agents["agents/"]
    tech --> t_agents["agents/"]
    transport --> tr_agents["agents/"]

    c_agents --> virtual_coach["virtual-coach/"]
    cl_agents --> power_analysis["power-analysis/"]
    i_agents --> claims_assistant["claims-assistant/"]
    t_agents --> seller_prospect["seller-prospect/"]
    t_agents --> it_help_desk["it-help-desk/"]
    tr_agents --> fuel_tracking["fuel-tracking/"]
    tr_agents --> fleet_coordinator["fleet-coordinator/"]

    virtual_coach --> vc_readme["README.md"]
    virtual_coach --> vc_runbook["runbook.md"]
    virtual_coach --> vc_template["templates/agent-template.yaml"]
    virtual_coach --> vc_solution["solution/solution-definition.yaml"]

    power_analysis --> pa_readme["README.md"]
    power_analysis --> pa_runbook["runbook.md"]
    power_analysis --> pa_template["templates/agent-template.yaml"]
    power_analysis --> pa_solution["solution/solution-definition.yaml"]

    claims_assistant --> ca_readme["README.md"]
    claims_assistant --> ca_runbook["runbook.md"]
    claims_assistant --> ca_template["templates/agent-template.yaml"]
    claims_assistant --> ca_solution["solution/solution-definition.yaml"]

    seller_prospect --> sp_readme["README.md"]
    seller_prospect --> sp_runbook["runbook.md"]
    seller_prospect --> sp_template["templates/agent-template.yaml"]
    seller_prospect --> sp_solution["solution/solution-definition.yaml"]

    it_help_desk --> ihd_readme["README.md"]
    it_help_desk --> ihd_runbook["runbook.md"]
    it_help_desk --> ihd_template["templates/agent-template.yaml"]
    it_help_desk --> ihd_solution["solution/solution-definition.yaml"]

    fuel_tracking --> ft_readme["README.md"]
    fuel_tracking --> ft_runbook["runbook.md"]
    fuel_tracking --> ft_template["templates/agent-template.yaml"]
    fuel_tracking --> ft_solution["solution/solution-definition.yaml"]

    fleet_coordinator --> fc_readme["README.md"]
    fleet_coordinator --> fc_runbook["runbook.md"]
    fleet_coordinator --> fc_template["templates/agent-template.yaml"]
    fleet_coordinator --> fc_solution["solution/solution-definition.yaml"]
```

## Agent Ecosystem Overview

This diagram shows all seven agents across five verticals, the primary data sources they rely on, and the shared Microsoft platform infrastructure used for orchestration, automation, data, and identity.

```mermaid
flowchart LR
    subgraph verticals["Vertical Agents"]
        vc["Virtual Coach (Coffee)"]
        pa["Power Analysis (Clothing)"]
        ca["Claims Assistant (Insurance)"]
        sp["Seller Prospect (Tech)"]
        ihd["IT Help Desk (Tech)"]
        ft["Fuel Tracking (Transportation)"]
        fc["Fleet Coordinator (Transportation)"]
    end

    subgraph data_sources["Primary Data Sources"]
        spo([SharePoint Hub + Libraries + Lists])
        dataverse([Dataverse Operational Tables])
        salesforce([Salesforce CRM])
        itsm([ServiceNow/Jira ITSM + KB])
        claims_core([Claims Core API + Compliance Rules])
        fleet_data([Fuel Card API + Telematics + Fleet Systems])
    end

    subgraph shared_infra["Shared Infrastructure"]
        cs["Copilot Studio"]
        pa_flow["Power Automate"]
        dv["Dataverse"]
        aad["Azure AD / Entra ID"]
    end

    vc --> spo
    vc --> cs
    vc --> pa_flow
    vc --> dv
    vc --> aad

    pa --> dataverse
    pa --> cs
    pa --> pa_flow
    pa --> dv
    pa --> aad

    ca --> claims_core
    ca --> cs
    ca --> pa_flow
    ca --> dv
    ca --> aad

    sp --> salesforce
    sp --> cs
    sp --> pa_flow
    sp --> dv
    sp --> aad

    ihd --> itsm
    ihd --> cs
    ihd --> pa_flow
    ihd --> dv
    ihd --> aad

    ft --> fleet_data
    ft --> cs
    ft --> pa_flow
    ft --> dv
    ft --> aad

    fc --> fleet_data
    fc --> cs
    fc --> pa_flow
    fc --> dv
    fc --> aad
```

## Coffee -- Virtual Coach

### SharePoint Knowledge Architecture

This architecture represents the three-tier SharePoint information hierarchy used by Virtual Coach. Content libraries and lists feed Copilot Studio knowledge grounding and operational topic actions.

```mermaid
flowchart TB
    corp["Corporate Hub Site"]
    reg1["Regional Hub: North"]
    reg2["Regional Hub: South"]
    reg3["Regional Hub: West"]

    store1["Store Site A"]
    store2["Store Site B"]
    store3["Store Site C"]
    store4["Store Site D"]

    recipes([Recipes Library])
    hr([HR Policy Library])
    training([Training Library])
    ops([Operations Library])
    handover([Shift Handover List])
    directory([Store Directory List])

    cs["Copilot Studio Knowledge Sources"]

    corp --> reg1
    corp --> reg2
    corp --> reg3

    reg1 --> store1
    reg1 --> store2
    reg2 --> store3
    reg3 --> store4

    corp --> recipes
    corp --> hr
    corp --> training
    corp --> ops
    store1 --> handover
    reg1 --> directory

    recipes --> cs
    hr --> cs
    training --> cs
    ops --> cs
    handover --> cs
    directory --> cs
```

### Conversation Flow

This flow shows how an incoming message is routed into one of five major intents, then either grounded from knowledge sources or fulfilled via list/query actions before response generation.

```mermaid
flowchart TD
    user("Store User")
    detect["Topic Detection"]
    route{"Intent?"}
    recipe["Drink Recipe Topic"]
    hrp["HR Policy Topic"]
    handover["Shift Handover Topic"]
    lookup["Store Lookup Topic"]
    esc["Escalation Topic"]
    ksearch["Knowledge Search"]
    listquery["List Query / Writeback"]
    response["Agent Response"]

    user --> detect --> route
    route -->|Drink Recipe| recipe
    route -->|HR Policy| hrp
    route -->|Shift Handover| handover
    route -->|Store Lookup| lookup
    route -->|Escalation| esc

    recipe --> ksearch
    hrp --> ksearch
    handover --> listquery
    lookup --> listquery
    esc --> listquery

    ksearch --> response
    listquery --> response
```

## Clothing -- Power Analysis

### Dataverse Data Model

This ER diagram captures the core retail analysis entities and the key store/SKU relationships used to support decomposition and root-cause reasoning.

```mermaid
erDiagram
    STOREMASTER ||--o{ SALESTRANSACTIONS : "store_id"
    PRODUCTCATALOG ||--o{ SALESTRANSACTIONS : "sku"
    STOREMASTER ||--o{ INVENTORYSNAPSHOTS : "store_id"
    PRODUCTCATALOG ||--o{ INVENTORYSNAPSHOTS : "sku"

    STOREMASTER {
        string store_id PK
        string store_name
        string region
        string country
        string format
    }

    PRODUCTCATALOG {
        string sku PK
        string product_id
        string brand
        string category
        string sub_category
        string season
    }

    SALESTRANSACTIONS {
        string transaction_id PK
        string store_id FK
        string sku FK
        date transaction_date
        int units_sold
        decimal net_sales_amount
        decimal gross_margin_amount
    }

    INVENTORYSNAPSHOTS {
        string snapshot_id PK
        string store_id FK
        string sku FK
        date snapshot_date
        int units_on_hand
        int units_received
        decimal weeks_cover
    }
```

### Multi-Step Reasoning Flow

This sequence shows decomposition behavior for a root-cause question, where the agent orchestrates multiple analytical queries before synthesizing a single explanation.

```mermaid
sequenceDiagram
    participant U as Business User
    participant A as Power Analysis Agent
    participant S as Sales Data Service
    participant I as Inventory Data Service
    participant ST as Staffing Data Service
    participant E as External Factors Service

    U->>A: Why did Store X underperform?
    A->>A: Decompose into analytical sub-questions
    A->>S: Query sales trends and margin deltas
    S-->>A: Sales variance by period/category
    A->>I: Query stockouts and weeks of cover
    I-->>A: Inventory pressure indicators
    A->>ST: Query staffing levels and shift coverage
    ST-->>A: Labor variance and coverage gaps
    A->>E: Query weather/events/promotions context
    E-->>A: External impact signals
    A->>A: Synthesize root causes and confidence
    A-->>U: Structured performance analysis + actions
```

### Data Pipeline Architecture

This pipeline illustrates operational ingestion from POS to Dataverse and downstream analytical branching for agent retrieval and long-horizon historical analysis.

```mermaid
flowchart LR
    pos["POS System"]
    sync["Power Automate Sync"]
    dv([Dataverse])
    agentq["Agent Queries"]
    synapse["Synapse Link"]
    hist["Historical Analysis"]

    pos --> sync --> dv
    dv --> agentq
    dv --> synapse --> hist
```

## Insurance -- Claims Assistant

### Claims Lifecycle Flow

This is the primary operating model for the claims journey. The diagram explicitly marks where automation is owned by the agent versus where human adjusters or investigators are mandatory.

```mermaid
flowchart LR
    fnol["FNOL Intake"]
    triage{"Complexity and Risk?"}
    investigation["Investigation"]
    adjustment["Adjustment"]
    settlement["Settlement"]
    subrogation["Subrogation"]

    agent_lane["Agent-Handled Stage"]
    human_lane["Human-Required Stage"]

    fnol --> triage
    triage -->|Low complexity| investigation
    triage -->|Medium or High complexity| human_review["Human Triage Review"]
    human_review --> investigation
    investigation --> adjustment --> settlement --> subrogation

    fnol -.-> agent_lane
    triage -.-> agent_lane
    settlement -.-> agent_lane
    human_review -.-> human_lane
    investigation -.-> human_lane
    adjustment -.-> human_lane
    subrogation -.-> human_lane
```

### Fraud Detection Pipeline

This pipeline shows fraud signal processing from intake through scoring and risk-tiered routing to automation or specialist review.

```mermaid
flowchart TD
    collect["FNOL Data Collection"]
    extract["Signal Extraction"]
    delay["Delay Signal"]
    consistency["Consistency Signal"]
    history["Claim History Signal"]
    geo["Geography Signal"]
    score["Scoring Engine"]
    risk{"Risk Tier?"}
    low["Low Risk: Auto-process"]
    med["Medium Risk: Flag for Review"]
    high["High Risk: Route to SIU"]

    collect --> extract
    extract --> delay
    extract --> consistency
    extract --> history
    extract --> geo
    delay --> score
    consistency --> score
    history --> score
    geo --> score
    score --> risk
    risk -->|Low| low
    risk -->|Medium| med
    risk -->|High| high
```

### Regulatory Compliance Flow

This sequence captures mandatory state-level control points before claim progression, ensuring disclosure and audit logging are completed in-band.

```mermaid
sequenceDiagram
    participant C as Claimant
    participant A as Claims Assistant
    participant R as State Rules Service
    participant L as Compliance Event Log

    C->>A: Submit claim
    A->>R: Lookup state-specific rules
    R-->>A: Required disclosures and timing constraints
    A-->>C: Present required disclosures
    A->>L: Log compliance event
    L-->>A: Event persisted
    A-->>C: Continue claim processing
```

## Tech -- Seller Prospect

### Dual-Channel Architecture

This architecture separates internal and external entry points while preserving one shared agent runtime. Channel and identity context determines topic set and data boundary.

```mermaid
flowchart LR
    teams("Sales Rep in Teams")
    web("Prospect in Web Chat")
    agent["Shared Copilot Studio Agent"]
    detect{"Channel Detection"}
    internal["Internal Topics + Salesforce Access"]
    external["External Topics + Public KB Only"]
    sf([Salesforce CRM])
    kb([Public Knowledge Base])

    teams --> agent
    web --> agent
    agent --> detect
    detect -->|Teams/Internal| internal
    detect -->|Web/External| external
    internal --> sf
    external --> kb
```

### Lead Qualification Funnel

This flow covers the external lead journey from first contact through BANT scoring and branching into sales handoff or nurture.

```mermaid
flowchart TD
    prospect("Website Prospect")
    greet["Web Chat Greeting"]
    budget["B: Budget Check"]
    authority["A: Authority Check"]
    need["N: Need Check"]
    timeline["T: Timeline Check"]
    score["Qualification Score Calculation"]
    decision{"Qualified?"}
    create["Create Salesforce Lead"]
    assign["Assign to Sales Rep"]
    nurture["Enter Nurture Campaign"]

    prospect --> greet --> budget --> authority --> need --> timeline --> score --> decision
    decision -->|Yes| create --> assign
    decision -->|No| nurture
```

### Salesforce Integration Flow

This sequence shows topic-triggered CRM actions executed through Power Automate with OAuth token acquisition, API invocation, and structured response mapping.

```mermaid
sequenceDiagram
    participant A as Seller Prospect Agent
    participant P as Power Automate Flow
    participant O as Salesforce OAuth
    participant S as Salesforce REST API

    A->>P: Trigger topic action
    P->>O: Request access token
    O-->>P: OAuth token
    P->>S: Execute CRM API operation
    S-->>P: API response payload
    P->>P: Parse and normalize response
    P-->>A: Structured result
    A-->>A: Render user-facing output
```

## Transportation -- Fuel Tracking

### Anomaly Detection Pipeline

This pipeline illustrates hourly transaction ingestion, multi-rule evaluation, and bifurcation into clean persistence or anomaly alerting for fleet operations.

```mermaid
flowchart TD
    ingest["Fuel Card Transactions (Hourly Ingestion)"]
    rules["Rule Engine"]
    volume["Volume Check"]
    location["Location Check"]
    frequency["Frequency Check"]
    price["Price Check"]
    timecheck["Time Check"]
    decision{"Anomaly?"}
    clean["Clean: Store Transaction"]
    anomaly["Anomaly: Flag + Alert Fleet Manager"]

    ingest --> rules
    rules --> volume
    rules --> location
    rules --> frequency
    rules --> price
    rules --> timecheck
    volume --> decision
    location --> decision
    frequency --> decision
    price --> decision
    timecheck --> decision
    decision -->|No| clean
    decision -->|Yes| anomaly
```

### System Integration Architecture

This diagram shows upstream transportation data feeds, automation pipelines, Dataverse storage, and downstream conversational surfaces for managers and drivers.

```mermaid
flowchart LR
    fuel_api["Fuel Card API"]
    tele_api["Telematics API"]
    price_api["Fuel Price API"]
    flows["Power Automate Flows"]
    dv([Dataverse Tables])
    agent["Copilot Studio Agent"]
    teams("Teams Channel for Managers")
    mobile("Mobile Web Channel for Drivers")

    fuel_api --> flows
    tele_api --> flows
    price_api --> flows
    flows --> dv --> agent
    agent --> teams
    agent --> mobile
```

## Cross-Cutting

### Deployment Pipeline

This release flow represents the standard promotion path from scaffolded development to production rollout and post-release monitoring.

```mermaid
flowchart LR
    dev["Development (Local Scaffold)"]
    test["Test (Import to Dev Environment)"]
    validate["Validate (Conversation Testing)"]
    stage["Stage (Import to Staging)"]
    prod["Production (Promote Solution)"]
    monitor["Monitor (Analytics Dashboard)"]

    dev --> test --> validate --> stage --> prod --> monitor
```

### Authentication Flow

This sequence diagram shows channel-specific authentication patterns with a shared identity outcome: user context and delegated token propagation into downstream flows.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Channel
    participant I as Identity Provider
    participant A as Copilot Studio Agent
    participant F as Power Automate Flows

    U->>C: Open channel
    C->>U: Present authentication challenge
    alt Teams channel
        C->>I: Azure AD SSO
        I-->>C: Teams token
    else Web channel (internal)
        C->>I: Azure AD redirect
        I-->>C: Web token
    else Web channel (external)
        C->>I: Azure AD B2C sign-in
        I-->>C: B2C token
    end
    C->>A: Send user token and context
    A->>F: Invoke flows with delegated token
    F-->>A: Authorized data/action result
    A-->>U: Authenticated response
```

