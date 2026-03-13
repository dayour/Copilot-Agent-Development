# Seller Prospect Agent -- Knowledge Base

This directory defines the knowledge base components that the Seller Prospect Agent uses across its internal (Teams) and external (web chat) channels. Each file specifies a distinct knowledge source with its content schema, audience visibility, and governance controls.

## Components

| File | Knowledge Source | Audience | Purpose |
|------|-----------------|----------|---------|
| [product-library.yaml](./product-library.yaml) | Public Product Library | External and internal | Public-safe product overviews, feature comparisons, pricing tiers, and technical specifications |
| [faq-collection.yaml](./faq-collection.yaml) | FAQ Collection | External and internal | Structured answers to common prospect questions on pricing, implementation, integration, and support |
| [case-studies.yaml](./case-studies.yaml) | Case Studies and Social Proof | External and internal | Curated customer success stories referenced when prospects ask "Who else uses this?" |
| [competitive-positioning.yaml](./competitive-positioning.yaml) | Competitive Positioning | Internal only | Battlecards and objection-handling guidance for sales reps; never surfaced to external prospects |
| [content-governance.yaml](./content-governance.yaml) | Content Governance | Maker and content admin | Approval workflow and review cadence for all externally visible knowledge content |

## Channel Visibility Rules

The agent enforces channel-based visibility at topic execution time:

- External web chat topics query only `public-product-library`, `faq-collection`, and `case-studies` knowledge sources.
- Internal Teams topics may additionally query `competitive-intel-library`.
- The `competitive-intel-library` is explicitly excluded from all external channel queries via topic-level conditions.

## Content Governance Summary

All content destined for the external channel must pass through the approval workflow defined in `content-governance.yaml` before it is published to any knowledge source marked `visibility: external`. See that file for reviewer roles, SLA targets, and escalation paths.

## Folder Structure

```text
tech/agents/seller-prospect/knowledge-base/
  README.md                      -- this file
  product-library.yaml           -- public product information
  faq-collection.yaml            -- prospect FAQ content
  case-studies.yaml              -- customer success stories
  competitive-positioning.yaml   -- internal-only competitive intel
  content-governance.yaml        -- approval workflow definition
```
