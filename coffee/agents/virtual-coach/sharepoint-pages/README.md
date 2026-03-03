# SharePoint Site Pages - Virtual Coach (Coffee)

This directory contains page templates, SPFx web part definitions, and permission configurations for the four SharePoint site pages that embed the Virtual Coach agent for in-context assistance across coffee store roles.

## Pages

| Page | URL Slug | Primary Audience | Embedded Agent |
|------|----------|-----------------|----------------|
| Store Dashboard | `/sites/coffee-ops/SitePages/store-dashboard.aspx` | Baristas, shift leads | Yes |
| New Hire Onboarding Hub | `/sites/coffee-ops/SitePages/new-hire-onboarding-hub.aspx` | New hires | Yes |
| Recipe Reference Center | `/sites/coffee-ops/SitePages/recipe-reference-center.aspx` | Baristas, shift leads | Yes |
| Manager Portal | `/sites/coffee-ops/SitePages/manager-portal.aspx` | Store managers, regional managers | Yes |

## Directory Structure

```text
sharepoint-pages/
|-- README.md
|-- store-dashboard.yaml
|-- new-hire-onboarding-hub.yaml
|-- recipe-reference-center.yaml
|-- manager-portal.yaml
|-- spfx-web-parts.yaml
`-- page-permissions.yaml
```

## SPFx Web Parts

Custom SPFx web parts are defined in `spfx-web-parts.yaml`. The solution package (`CoffeeVirtualCoachSPFx.sppkg`) must be deployed to the App Catalog before provisioning any of the four pages. See `spfx-web-parts.yaml` for component IDs and property schemas.

## Permissions

Page-level permissions are defined in `page-permissions.yaml`. Each page is locked to one or more Azure AD security groups. Unique permissions are broken from the parent site for pages that serve a restricted audience (Manager Portal). All other pages inherit site-level read access for all-store-staff.

## Responsive Design

All pages use a two-column layout on screens wider than 1024 px (content left, agent right) and collapse to a single-column stacked layout on screens narrower than 1024 px (tablets and phones). The Virtual Coach embed web part enforces a minimum height of 480 px and a maximum width of 420 px in the agent column.

## Deployment Steps

1. Deploy `CoffeeVirtualCoachSPFx.sppkg` to the SharePoint App Catalog.
2. Activate the app on the target site collection (`/sites/coffee-ops`).
3. Provision each page using the YAML templates in this directory with your preferred site provisioning tool (PnP PowerShell, SharePoint Provisioning Engine, or manual creation).
4. Apply permissions as defined in `page-permissions.yaml`.
5. Set the `agentEmbedUrl` and `tenantId` web part properties on every page to the published Virtual Coach embed URL and your Microsoft 365 tenant ID.
6. Validate each page on a tablet (1024 px) and a phone (375 px) viewport before go-live.
