# Heyra Now Sprint Backlog

## Purpose

This is the execution version of the `Now` backlog in
[implementation-backlog.md](/Users/steinar/claude/heyra/docs/planning/implementation-backlog.md).

It is sequenced for delivery and written as ticket-sized tasks.

## Sprint N1: Compliance foundation

### Goal

Create the first real compliance model and make it visible in the product.

### Tickets

1. Add `ComplianceTask` and related enums to Prisma.
   - Include task type, status, due date, booking relation, listing relation, assignee role, and notes.

2. Add compliance-task creation helpers in the backend.
   - Centralize task creation so booking and listing flows do not duplicate logic.

3. Trigger compliance tasks on booking confirmation.
   - CWD area booking
   - salmon / sea-trout fee reminder
   - post-trip reporting follow-up where relevant

4. Trigger compliance tasks on listing publish for relevant fishing and big-game cases.

5. Add hunter compliance dashboard page.
   - show active, upcoming, overdue, completed

6. Add landowner compliance dashboard page.
   - show tasks grouped by property or listing

7. Add first admin visibility for compliance tasks.
   - filter by task type and status

### Exit criteria

- compliance tasks exist in the schema
- tasks are created automatically from at least one booking flow
- hunters and landowners can see their tasks

## Sprint N2: Compliance integrations without providers

### Goal

Make the compliance tasks useful rather than only stored.

### Tickets

1. Add Hjorteviltregisteret deep-link builder utilities.
2. Add deep-link actions on relevant task cards and booking pages.
3. Add salmon-reporting prompt content and task flow.
4. Add CWD contact directory model or config source.
5. Surface CWD vet/contact information on affected tasks and listings.
6. Add booking and listing messaging that explains why a compliance task exists.
7. Add tests for compliance-task creation and deep-link generation.

### Exit criteria

- at least one task type links users toward a real external reporting action
- CWD tasks include practical next-step information

## Sprint N3: Geospatial discovery hardening

### Goal

Turn discovery into a stronger public search experience.

### Tickets

1. Add public search API for bbox and nearby queries.
2. Add map-ready listing result shape with center point, type, species, price, and trust summary.
3. Build a public listings map view.
4. Add stronger filters:
   - municipality
   - type
   - species
   - price range
   - availability indicator
5. Improve nearby fishing discovery ranking and presentation.
6. Add search-state URL persistence and crawl-safe metadata behavior.
7. Add tests around search params and search result shaping.
8. Add Kartverket / Geonorge parcel lookup through the intended REST path, with WFS fallback.
9. Let each listing choose which rights overlay is public.
10. Improve public listing map communication so users can distinguish cadastral parcel from actual offer area.

### Exit criteria

- users can search listings by map area or nearby location
- public discovery is materially stronger than the current simple list
- parcel import and public area presentation feel trustworthy rather than opaque

## Sprint N4: Big-game governance hardening

### Goal

Make big-game listings more realistic for Norwegian shared hunting structures.

### Tickets

1. Review current `Vald` model against expected `Jaktfelt` needs and write the decision down.
2. Extend the `Vald` model with municipality, local reference, authority contact, and confidence fields.
3. Add separate confidence signals for:
   - geometry
   - rights
   - governance

4. Add "approximate boundary" and "rights differ from mapped property" support.
5. Add explicit `valdansvarlig` contact and confirmation status fields.
6. Expand listing quota structure.
   - summary
   - permit notes
   - quota availability
   - reporting responsibility

7. Add booking-side quota visibility on listing and booking pages.
8. Add explicit booking state for shared confirmation if needed.
9. Add stronger admin review checks for big-game listing completeness and geometry-versus-governance mismatch.
10. Add landowner warnings when publishing a big-game listing without adequate governance context.
11. Add support for manual governance evidence and municipality-process notes.
12. Add tests around big-game publish-readiness validation.

### Exit criteria

- big-game listings can no longer look “individually bookable” when they are really shared-governance offers
- listings can express uncertainty in boundaries, rights, and governance honestly

## Sprint N5: Service marketplace foundation

### Goal

Create the first useful service-provider layer in Norway.

### Tickets

1. Add `ServiceListing` and supporting schema models.
   - category
   - provider identity
   - moderation status
   - location
   - qualification fields

2. Add service provider onboarding flow.
3. Add admin review for services.
4. Add service CRUD pages for providers.
5. Add public service listing and detail pages.
6. Add nearby-services query and first integration on listing detail pages.
7. Add initial categories:
   - dog handler
   - butcher
   - accommodation
   - transport

### Exit criteria

- service providers can be created, reviewed, published, and discovered
- nearby services appear on relevant listing pages

## Sprint N6: Service trust and Norway gate prep

### Goal

Make the service marketplace trustworthy enough to count toward Norway readiness.

### Tickets

1. Add service-provider trust badges and qualification display.
2. Add service-provider review linkage if appropriate.
3. Add provider moderation notes and admin actions.
4. Add service-side SEO and structured data.
5. Add service usage reporting for launch readiness.
6. Review whether bundled checkout is ready to enter the `Next` execution track.
7. Write Norway gate status against:
   - compliance
   - geospatial discovery
   - big-game governance
   - service marketplace

### Exit criteria

- the service layer is not only present but credible
- Phase 2 gate status can be evaluated with evidence

## Suggested execution order

1. Sprint N1
2. Sprint N2
3. Sprint N3
4. Sprint N4
5. Sprint N5
6. Sprint N6

## Notes

- Provider integrations stay out of these sprints unless credentials and contracts are available.
- Bokmal-first remains the default during this sequence.
- If `Jaktfelt` becomes necessary during Sprint N4, it should be inserted before service-bundling work, not after.
