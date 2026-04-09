# Heyra Implementation Backlog

## Status snapshot

This backlog has been refreshed to match the current product, not the earlier
Phase 1 plan.

### Substantially complete

- Compliance foundation and practical task surfaces
- Geospatial discovery hardening
- Kartverket / Geonorge parcel and rights-layer workflow
- Big-game `vald` governance hardening
- Service marketplace foundation
- Service trust and Norway gate preparation
- Admin split and main-app navigation simplification
- Seeded demo data for realistic testing

### Partially complete

- Bokmal and English product language
- User management
- Fishing-specific product maturity
- Launch hardening

### Still clearly open

- Bundled commerce and services
- Compliance reminders and scheduled jobs
- Identity and launch trust hardening
- Fishing lane maturity
- User-management expansion
- Final language/system-message cleanup

## Next execution backlog

These are the strongest remaining Norway-first workstreams.

### 1. Compliance reminders and scheduled jobs

1. Add a real jobs layer for reminder scheduling.
2. Add annual catch-report reminders.
3. Add `Sett og skutt` reminder scheduling for active moose-season bookings.
4. Add booking-confirmation reminders for CWD and reporting-heavy flows.
5. Add dashboard visibility for upcoming and overdue compliance actions.
6. Add admin visibility for reminder failures or stale jobs.

### 2. User management expansion

1. Build `/admin/users` as the admin directory.
2. Add user search by name and email.
3. Add filters for role, status, email verification, and provider state.
4. Build `/admin/users/[id]` with notes, audit, trust, bookings, properties, services, disputes, and compliance context.
5. Add admin actions for review, suspension, and reactivation.
6. Add a self-serve account center under `/dashboard/settings/account`.
7. Add tests for role/status transitions and policy gating.

### 3. Language completion

1. Finish Bokmal on compliance, admin, and remaining dashboard flows.
2. Finish user-visible validation and API response language.
3. Review notification titles and bodies.
4. Remove remaining mixed-language states from property, listing, booking, and service flows.
5. Keep English as a clean secondary option, not a Bokmal fallback.

### 4. Bundled commerce and services

1. Design the cart model for listing booking plus service add-ons.
2. Add bundled checkout structures.
3. Build booking-plus-service summary UI.
4. Add split payout logic in the simulated/local-first layer.
5. Define the provider-hardening path for real transfers later.

### 5. Fishing lane maturity

1. Add clearer fishing-specific listing templates.
2. Add water-specific rule structures instead of generic notes only.
3. Improve proof-of-licence display and field-use affordances.
4. Add edge-of-area fishing guidance, not only outside-area warnings.
5. Strengthen nearby instant-fishing conversion surfaces.

## Supporting backlog

These are still important, but should follow the tracks above unless a user or
deployment issue reprioritises them.

### Launch hardening

1. Expand Playwright from smoke coverage to full stateful end-to-end flows.
2. Execute load testing against realistic hosting and database settings.
3. Turn OWASP and GDPR checklists into reviewed sign-off documents.
4. Strengthen beta-ops and structured feedback loops.

### Architecture and platform

1. Reassess Auth.js v5 only if provider complexity justifies migration.
2. Reassess `shadcn/ui` only if the custom system becomes a maintenance burden.
3. Add monitoring and analytics choices once operational needs are clearer.

## Integration hardening

These remain separate from local-first product completion.

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
2. Compliance automation covers reminders, CWD prompts, and reporting guidance.
3. Service marketplace is live and credible in Norway.
4. The `vald` / shared-governance model is good enough for real big-game use.
5. A provider-hardening plan exists for identity, payments, signatures, storage, email, and push.
