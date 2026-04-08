# Heyra Integration Note: Kartverket / Geonorge Property Overlay

## Purpose

This note defines how Heyra should integrate official Norwegian property overlays and parcel lookup from Kartverket / Geonorge.

The goal is:
- use official cadastral data as a property-context layer
- allow landowners to import parcel geometry as a starting point
- keep hunting and fishing rights as a Heyra-owned overlay model
- avoid treating a parcel boundary as proof of commercial hunting or fishing rights

This is not a plan to recreate `Seeiendom` or `Norgeskart`. It is a focused integration that gives Heyra better boundary quality, better trust signals, and a clearer editing flow.

## Product position

Heyra should use official parcel data for:
- property lookup
- parcel import
- cadastral background overlay
- provenance and confidence

Heyra should **not** rely on Kartverket / Geonorge to model:
- actual huntable or fishable area
- internal access routes
- parking / entry areas
- exclusions inside an offer area
- rights that differ from property geometry

Those remain Heyra-managed overlays.

## Recommended integration stack

### 1. Parcel lookup / identify

Use the public property localization API:

- Service: `Eiendom REST-API for lokalisering`
- Base: `https://ws.geonorge.no/eiendom/v1/`
- Official dataset:
  [https://data.norge.no/en/datasets/6219fb0e-74eb-368b-8ba5-452b1a736220/matrikkelen-eiendomskart-teig](https://data.norge.no/en/datasets/6219fb0e-74eb-368b-8ba5-452b1a736220/matrikkelen-eiendomskart-teig)

Use this for:
- click/point-based property lookup
- matrikkel lookup by `kommunenummer + gnr + bnr (+ fnr/snr)`
- candidate selection in the boundary step

### 2. Parcel geometry import

Use the public WFS service for parcel geometry:

- Service: `Matrikkelen - Eiendomskart - Teig WFS`
- Capabilities:
  [https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig?Service=WFS&Request=GetCapabilities](https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig?Service=WFS&Request=GetCapabilities)

Use this for:
- fetching the actual teig geometry
- importing it into `Property.boundary`
- storing `boundarySource`, `boundaryImportedAt`, `boundarySourceRef`, and `boundarySourceLabel`

### 3. Property overlay for visual context

Use a public WMS overlay:

- Richer cadastral overlay:
  `https://wms.geonorge.no/skwms1/wms.matrikkelkart`
- Simpler cadastral overlay:
  `https://wms.geonorge.no/skwms1/wms.matrikkel`

Use this for:
- boundary-step visual context in the map editor
- optional property outline comparison on listing/detail maps

Do not rely on WMS for persisted application geometry.

### 4. Heyra-owned rights layers

Keep the actual product layers in Heyra:
- `HUNTING_AREA`
- `FISHING_ZONE`
- `EXCLUDED_ZONE`
- `ACCESS_ZONE`
- `ENTRY_ZONE`

These are already the correct abstraction for:
- practical offer area
- access and exclusions
- public simplified area vs booker-only detail
- future imports from fragmented or local sources

## Open/public access assumption

For the public services above, no API key is currently required in the public catalog metadata.

Working assumption for Heyra v1:
- WFS/WMS/REST services above are open/public
- no API key is needed
- if a service becomes gated later, integration should degrade gracefully back to manual editing

This should remain a tracked risk, not a blocker.

## Current Heyra implementation status

The service already has the first implementation layer in code:

- parcel provenance and import fields in:
  [prisma/schema.prisma](/Users/steinar/claude/heyra/prisma/schema.prisma)
- migration:
  [prisma/migrations/0024_kartverket_parcels_and_rights_overlays/migration.sql](/Users/steinar/claude/heyra/prisma/migrations/0024_kartverket_parcels_and_rights_overlays/migration.sql)
- shared adapter:
  [src/lib/kartverket-parcels.ts](/Users/steinar/claude/heyra/src/lib/kartverket-parcels.ts)
- geometry helpers:
  [src/lib/geometry.ts](/Users/steinar/claude/heyra/src/lib/geometry.ts)
- parcel endpoints:
  [src/app/api/properties/parcel-search/route.ts](/Users/steinar/claude/heyra/src/app/api/properties/parcel-search/route.ts)
  [src/app/api/properties/[id]/parcel-import/route.ts](/Users/steinar/claude/heyra/src/app/api/properties/[id]/parcel-import/route.ts)
- rights overlay endpoints:
  [src/app/api/properties/[id]/rights-overlays/route.ts](/Users/steinar/claude/heyra/src/app/api/properties/[id]/rights-overlays/route.ts)
  [src/app/api/rights-overlays/[id]/route.ts](/Users/steinar/claude/heyra/src/app/api/rights-overlays/[id]/route.ts)
- boundary workflow:
  [src/components/property/boundary-editor.tsx](/Users/steinar/claude/heyra/src/components/property/boundary-editor.tsx)
  [src/components/property/boundary-map-inner.tsx](/Users/steinar/claude/heyra/src/components/property/boundary-map-inner.tsx)
  [src/components/property/rights-overlay-editor.tsx](/Users/steinar/claude/heyra/src/components/property/rights-overlay-editor.tsx)
- public listing map usage:
  [src/components/listings/listing-area-map.tsx](/Users/steinar/claude/heyra/src/components/listings/listing-area-map.tsx)
  [src/components/listings/listing-area-map-inner.tsx](/Users/steinar/claude/heyra/src/components/listings/listing-area-map-inner.tsx)
  [src/app/api/listings/[id]/area/route.ts](/Users/steinar/claude/heyra/src/app/api/listings/[id]/area/route.ts)

## What still needs to be implemented

### 1. Prefer the official REST API for lookup

The current adapter uses WFS capabilities and feature queries as the robust base.

That works, but the intended product direction should still be:
- REST API for lookup/identify
- WFS for geometry import

Recommended next step:
- add a dedicated REST lookup adapter path in `src/lib/kartverket-parcels.ts`
- keep the current WFS lookup as fallback

### 2. Stronger matrikkel candidate resolution

Current matching is score-based by:
- municipality
- gnr
- bnr
- feste
- section

Recommended next step:
- persist the selected parcel reference into property review context
- show clearer “exact matrikkel match” vs “best candidate from map area”
- let users explicitly confirm when using a non-exact candidate

### 3. Better public map communication

The listing page now distinguishes:
- public offer area
- parcel/property boundary

Recommended next step:
- add a legend
- expose layer labels more clearly
- show “public area differs from cadastral parcel” messaging when applicable

### 4. Listing editor linkage

Recommended next step:
- allow a landowner to explicitly choose which rights overlay is public for each listing
- do not rely only on first-match public layer selection

### 5. Review/admin support

Recommended next step:
- surface parcel provenance and rights overlay count in admin review
- flag listings where:
  - parcel exists
  - no rights overlay exists
  - property is marked as `rightsDifferFromBoundary`

## Business rule that must not change

Parcel boundary is:
- cadastral context
- ownership-related map data
- useful for import and trust

Parcel boundary is **not**:
- proof of hunting or fishing rights
- proof of commercial offer scope
- proof of internal access rights

Every Heyra surface should preserve that distinction.

## Suggested next backlog items

1. `KARTVERKET-1`
   Add REST-based parcel lookup path in the adapter and keep WFS lookup as fallback.

2. `KARTVERKET-2`
   Add explicit “selected public rights layer” support on each listing.

3. `KARTVERKET-3`
   Improve public listing map legend and parcel-vs-rights explanation.

4. `KARTVERKET-4`
   Add admin review signals for parcel provenance and rights mismatch.

5. `KARTVERKET-5`
   Add import-state UX for:
   - exact matrikkel match
   - likely match
   - map-area-only candidate

## Source references

- Eiendom REST-API for lokalisering:
  [https://ws.geonorge.no/eiendom/v1/](https://ws.geonorge.no/eiendom/v1/)
- Dataset metadata:
  [https://data.norge.no/en/datasets/6219fb0e-74eb-368b-8ba5-452b1a736220/matrikkelen-eiendomskart-teig](https://data.norge.no/en/datasets/6219fb0e-74eb-368b-8ba5-452b1a736220/matrikkelen-eiendomskart-teig)
- WFS capabilities:
  [https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig?Service=WFS&Request=GetCapabilities](https://wfs.geonorge.no/skwms1/wfs.matrikkelen-eiendomskart-teig?Service=WFS&Request=GetCapabilities)
- WMS cadastral overlay:
  [https://wms.geonorge.no/skwms1/wms.matrikkelkart](https://wms.geonorge.no/skwms1/wms.matrikkelkart)
- Simpler WMS cadastral overlay:
  [https://wms.geonorge.no/skwms1/wms.matrikkel](https://wms.geonorge.no/skwms1/wms.matrikkel)
