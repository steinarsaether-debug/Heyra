# Design Refresh Backlog

## Goal

Carry the stronger marketplace presentation introduced on the homepage and browse pages through the rest of the Heyra experience without changing the current product architecture.

## Current Status

Completed:
- Phase 1: homepage refresh
- Phase 2: listings and services browse refresh

Remaining:
- Phase 3: detail-page consistency
- Shared UI extraction and system cleanup
- Content and image curation
- Visual QA and responsive polish

## Priority 1: Detail Pages

### Listings detail page

Target:
- `/src/app/listings/[slug]/page.tsx`

Work:
- Redesign the hero/gallery area so listings open with a stronger sense of place and trip quality
- Improve information hierarchy between overview, trust, access, pricing, and booking actions
- Make the booking block feel more premium and easier to scan
- Bring maps, compliance, and host quality into a clearer visual rhythm
- Tighten supporting sections so the page feels editorial and commercial, not document-like

Success criteria:
- Listing pages feel like a continuation of the refreshed browse cards
- Guests can understand trip type, location confidence, trust, and booking expectations without hunting through dense copy

### Services detail page

Target:
- `/src/app/services/[slug]/page.tsx`

Work:
- Strengthen the service hero/header treatment
- Improve provider profile presentation and trust framing
- Clarify pricing, location, availability, and booking/lead actions
- Make service pages feel like part of the same marketplace as listings, not a secondary product lane

Success criteria:
- Services look intentionally merchandised
- Provider trust and service fit are obvious above the fold

## Priority 2: Shared Component Cleanup

Targets:
- listing cards currently styled inline in `/src/app/listings/page.tsx`
- service cards currently styled inline in `/src/app/services/page.tsx`

Work:
- Extract shared listing card component
- Extract shared service card component
- Centralize repeated visual tokens and repeated copy patterns where it makes sense
- Reduce duplication between featured cards and standard browse cards

Success criteria:
- Browse styling becomes easier to maintain
- Future visual iteration no longer requires editing full page files for every card tweak

## Priority 3: Visual System Hardening

Work:
- Review spacing, shadows, border treatments, and radii for consistency
- Normalize CTA styles across homepage, browse, dashboard entry points, and detail views
- Audit headings and section intros so pages share a common narrative rhythm
- Review where gradients and overlays are used and remove any that feel ornamental rather than purposeful

Success criteria:
- The product feels like one coherent visual system instead of a few upgraded surfaces

## Priority 4: Content and Imagery

Work:
- Replace weak or overly generic imagery where needed
- Curate more believable marketplace copy for featured sections, banners, and cards
- Review truncation and metadata density on cards
- Add more intentional seasonal and regional merchandising copy

Success criteria:
- Visual polish is supported by stronger content, not just stronger layout

## Priority 5: QA and Validation

Work:
- Run a responsive pass on homepage, listings, and services
- Check hover/focus states for interactive elements
- Verify list and map modes still feel consistent
- Do a visual browser pass for spacing issues that lint cannot catch
- Sanity-check English and Bokmal copy after the redesign

Success criteria:
- The redesign holds up on desktop and mobile
- No obvious visual regressions remain in core marketplace flows

## Suggested Next Sequence

1. Refresh listing detail page
2. Refresh service detail page
3. Extract shared browse card components
4. Run visual QA and content cleanup pass
