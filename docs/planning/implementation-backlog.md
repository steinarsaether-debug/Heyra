# Heyra Implementation Backlog

## How to read this backlog

- `Now`: the next practical work to move the Norway product forward
- `Next`: important Phase 1 work that should follow soon after
- `Later`: still important, but should not block the strongest Norway-first delivery path
- `Integration hardening`: work that depends on external providers, contracts, credentials, or formal compliance review

This backlog reflects what the product has taught us so far:

- `Vald` governance is a first-class concern for big-game listings
- instant fishing is its own product lane
- compliance automation should be prioritised before Nordic expansion
- service marketplace should be live in Norway before Phase 2
- local-first workflow completion and provider hardening are different tracks

## Now

### 1. Compliance automation core

1. Add `ComplianceTask` to the Prisma schema and define the first task types.
2. Trigger compliance tasks from booking and listing events.
3. Add a hunter-facing compliance workspace in the dashboard.
4. Add a landowner-facing compliance overview for active listings and bookings.
5. Add Hjorteviltregisteret deep-link generation for relevant harvest flows.
6. Add salmon reporting prompts for registered salmon beats and camps.
7. Add a CWD vet and contact directory connected to stored CWD zones.

### 2. Geospatial discovery hardening

1. Build public map-based listing search.
2. Add PostGIS bbox and nearby search APIs.
3. Expand filters for municipality, price, listing type, species, and availability.
4. Improve the nearby fishing journey so it works as the clear fast-entry discovery surface.
5. Add stronger route-level SEO for key Norwegian discovery pages.
6. Add official Kartverket / Geonorge parcel lookup using the REST API, with WFS fallback.
7. Let listings explicitly choose which rights overlay is public.
8. Improve public map legend and parcel-versus-rights explanation on listing pages.
9. Add admin review signals for parcel provenance and rights mismatch.
10. Add clearer import UX for exact matrikkel match versus likely candidate.

### 3. Big-game governance hardening

1. Review whether `Vald` is enough or whether a `Jaktfelt` model is needed next.
2. Extend `Vald` with municipality, local reference, authority contact, confidence, and verification fields.
3. Add separate `geometryConfidence`, `rightsConfidence`, and `governanceConfidence` signals for properties and listings.
4. Add an "approximate boundary / rights differ from map" model and warnings in property and listing flows.
5. Add explicit `valdansvarlig` contact and confirmation status handling.
6. Add clearer quota fields for big-game offers.
7. Add booking-side quota visibility and depletion guidance.
8. Add clearer co-approval states in booking status, not just shared notes.
9. Add publishing checks that enforce `vald`-aware big-game completeness.
10. Add admin review checks for geometry-versus-governance mismatch.
11. Add support for uploading or recording manual governance evidence and municipality-process notes.

### 4. Service marketplace foundation

1. Add `ServiceListing` and related schema models.
2. Build service provider onboarding and admin review.
3. Build service listing CRUD and public service detail pages.
4. Add nearby services on listing detail pages.
5. Add first service categories:
   - dog handler
   - butcher
   - accommodation
   - transport
6. Add first service-provider trust and verification fields.

## Next

### 5. Bundled commerce and services

1. Design the cart model for listing booking plus service add-ons.
2. Add bundled checkout data structures.
3. Add booking plus service summary UI.
4. Add split payout logic in the local-first commerce layer.
5. Prepare the provider-hardening path for real transfers later.

### 6. Compliance reminders and scheduled jobs

1. Add a jobs layer for reminder scheduling.
2. Add annual catch-report reminders.
3. Add `Sett og skutt` reminder scheduling for active moose-season bookings.
4. Add booking-confirmation compliance reminders for CWD areas.
5. Add dashboard visibility for upcoming and overdue compliance actions.

### 7. Identity and launch trust hardening

1. Add real landowner joint-controller acceptance as a publish gate.
2. Add a clearer hunter licence verification workflow for landowners.
3. Add trust badges that distinguish:
   - locally verified workflow completion
   - provider-backed identity verification
4. Add moderation/admin audit visibility around reviews, reports, and disputes.

### 8. Fishing lane maturity

1. Add clearer fishing-specific listing templates.
2. Add water-specific rule structures rather than generic notes only.
3. Add better proof-of-licence display and field-use affordances.
4. Add fishing-area guidance for when users move close to the edge, not only outside.
5. Add stronger instant-fishing conversion surfaces on nearby discovery pages.

## Later

### 9. Multilingual foundation

1. Keep Bokmal-first for launch.
2. Plan `next-intl` adoption only when Norway surfaces are stable.
3. Add English and Nynorsk as a hardening step, not a launch blocker.

### 10. Architecture upgrades

1. Reassess Auth.js v5 migration only if provider complexity makes it worthwhile.
2. Reassess `shadcn/ui` only if the custom design system becomes a maintenance burden.
3. Add monitoring/analytics platform choices once operational needs are clearer.

### 11. Full launch hardening

1. Expand Playwright from smoke coverage to true end-to-end stateful flows.
2. Execute load testing against realistic hosting and database settings.
3. Turn OWASP and GDPR launch checklists into reviewed sign-off documents.
4. Build a stronger beta-ops workflow for host recruitment and feedback loops.

## Integration hardening

These should be tracked continuously, but implemented only when credentials, agreements, and documentation are in place.

### Identity

1. Vipps Login
2. BankID via Signicat or Criipto
3. Provider-backed verification badges

### Payments and payouts

1. Stripe Connect
2. Vipps Checkout
3. Real webhook handling
4. Real payout onboarding and capture timing

### Documents and notifications

1. Resend email delivery
2. Signicat signing
3. Cloudflare R2 for documents and uploads
4. Real web-push subscriptions and delivery

## Norway readiness gate before Phase 2

Do not begin Nordic expansion until all of these are true:

1. Norway booking, trust, and instant-fishing flows are stable.
2. Compliance automation is live enough to cover reminders, CWD prompts, and reporting guidance.
3. Service marketplace is live in Norway.
4. The `vald` / shared-governance model is good enough for real big-game use.
5. A provider-hardening plan exists for identity, payments, signatures, storage, email, and push.
