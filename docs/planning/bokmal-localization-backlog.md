# Norwegian Bokmal Localization Backlog

## Summary

Heyra already has a partial Norway-first foundation:
- `lang="nb"` is set in the app shell
- many dates and numbers already use `nb-NO`
- the product domain is Norwegian

What is still missing is the actual interface language layer. Most UI copy is hardcoded in English across pages, components, validation, and API responses.

This backlog focuses on introducing **Norwegian Bokmal as the primary product language** in a practical way, without making multilingual support a Phase 1 blocker.

## Goals

1. Make the public and signed-in product feel natively Norwegian.
2. Avoid a risky "translate everything at once" rewrite.
3. Introduce a localization structure that can later support Nynorsk and English.
4. Keep the current product stable while we migrate screen by screen.

## Principles

- Bokmal is the default and only required product language in this rollout.
- We should not block this work on full `next-intl` setup for multiple locales.
- We should start with shared copy extraction, not mass string hunting by hand.
- High-traffic and high-trust surfaces come first.
- Compliance, booking, listing, and service workflows should use consistent Norwegian terminology.

## Current State

### Already in place
- HTML language tag in [src/app/layout.tsx](/Users/steinar/claude/heyra/src/app/layout.tsx)
- Norwegian locale formatting in many places via `toLocaleDateString("nb-NO")` and `toLocaleString("nb-NO")`
- Norway-first domain concepts in product and roadmap

### Missing
- centralized translation files
- shared terminology dictionary
- consistent Bokmal UI copy
- translated validation and error messages
- translated notification/content templates
- translated SEO copy and metadata strategy

## Recommended Implementation Shape

### Phase B0: Foundations
Introduce a lightweight localization structure first, then migrate feature areas into it.

Recommended shape:
- `src/lib/i18n/nb.ts` for initial Bokmal message groups
- small helper utilities for copy lookup
- grouped copy by feature area, not by giant monolithic file

Suggested structure:
- `src/lib/i18n/nb/common.ts`
- `src/lib/i18n/nb/auth.ts`
- `src/lib/i18n/nb/listings.ts`
- `src/lib/i18n/nb/bookings.ts`
- `src/lib/i18n/nb/compliance.ts`
- `src/lib/i18n/nb/services.ts`
- `src/lib/i18n/nb/admin.ts`

This keeps the migration incremental and makes a later move to `next-intl` easier if needed.

## Sprint Backlog

### BKM1: Terminology and copy foundation
Goal: define the Norwegian product language before translating screens.

Tasks:
1. Create a Bokmal terminology glossary for core product words.
2. Decide preferred product terms for:
   - listing
   - booking
   - landowner
   - hunter
   - service provider
   - compliance task
   - dispute
   - review
   - field mode
   - instant fishing licence / fishing card wording
3. Add a lightweight i18n folder structure under `src/lib/i18n/`.
4. Extract shared navigation, button, form, and status labels into Bokmal dictionaries.
5. Create a style rule: new UI copy should not be hardcoded directly in components unless temporary.

Exit criteria:
- terminology doc exists
- shared copy files exist
- common shell/navigation text is sourced from Bokmal dictionaries

### BKM2: Public surface localization
Goal: make the public-facing discovery experience Norwegian first.

Tasks:
1. Translate homepage copy.
2. Translate listings index and nearby-fishing discovery copy.
3. Translate listing detail pages, including:
   - CTA labels
   - trust sections
   - governance explanations
   - compliance guidance
4. Translate services index/detail public copy.
5. Translate public empty states, share UI, and marketing prompts.
6. Review public metadata titles/descriptions for Bokmal wording.

Exit criteria:
- homepage and public discovery surfaces are Bokmal-first
- public CTAs and support text are no longer mixed-language

### BKM3: Auth and self-serve account localization
Goal: make onboarding and account management feel native and trustworthy.

Tasks:
1. Translate login, registration, verify-email, forgot-password, and reset-password flows.
2. Translate dashboard shell labels and signed-in navigation.
3. Translate profile, legal settings, and notification settings pages.
4. Translate cookie consent and legal preference copy.
5. Translate self-serve account status messages and blocked/suspended copy.

Exit criteria:
- auth and account flows are Bokmal-first end to end

### BKM4: Core marketplace workflow localization
Goal: cover the most important operational journeys.

Tasks:
1. Translate property wizard and property workspace.
2. Translate boundary editing and map guidance.
3. Translate listing editor and publish/review workflow.
4. Translate booking request, booking workspace, contract-sign flow, and payment simulation UI.
5. Translate fishing field mode and licence surfaces.
6. Translate marketing/share toolkit for landowners and guests.

Exit criteria:
- landowner and hunter core workflows are Bokmal-first

### BKM5: Compliance and trust localization
Goal: localize the parts where wording quality most affects trust.

Tasks:
1. Translate compliance dashboard and admin compliance queue.
2. Translate CWD and reporting guidance.
3. Translate review, experience-sharing, dispute, and moderation copy.
4. Translate service-provider trust and provider review language.
5. Review wording with a "plain Norwegian" pass for older users.

Exit criteria:
- trust and compliance surfaces are consistent and understandable in Bokmal

### BKM6: Admin and operational localization
Goal: complete the operational layer.

Tasks:
1. Translate admin review queues.
2. Translate admin compliance and user-management surfaces.
3. Translate moderation actions, status changes, notes, and internal guidance labels.
4. Translate payout and launch-readiness dashboards.

Exit criteria:
- admin/operators can use the main tools in Bokmal without mixed English UI

### BKM7: Validation, API responses, and notification copy
Goal: remove mixed-language system feedback.

Tasks:
1. Translate Zod validation messages and form errors.
2. Translate API success/error messages returned to the UI.
3. Translate notification bodies/titles that users see in-app.
4. Translate export/document labels where applicable.
5. Standardize tone for warnings, confirmations, and support guidance.

Exit criteria:
- user-visible system messaging is Bokmal-first

### BKM8: SEO and content polish
Goal: align language rollout with discovery and trust.

Tasks:
1. Rewrite public metadata and hero copy in natural Bokmal.
2. Review URL naming strategy for Norway-facing entry pages.
3. Add Bokmal keyword-aware copy for hunting, fishing, and services surfaces.
4. Review structured data descriptions for natural Norwegian phrasing.
5. Create a copy review checklist for future marketing and launch pages.

Exit criteria:
- public SEO copy is coherent and Norwegian-first

## Technical Notes

### Recommended first-step implementation
- do not try to localize with free-text search-and-replace
- first extract shared shell and CTA text into dictionaries
- then migrate page families one by one

### Suggested helper pattern
- `copy.common.actions.save`
- `copy.auth.login.title`
- `copy.listings.detail.instantBook`

This keeps the code readable and avoids a giant untyped translation blob.

### Later upgrade path
If we later need full locale routing and multiple languages:
- migrate the same grouped message files into `next-intl`
- add `nn` and `en` after Bokmal is stable

## Risks

1. Mixed language during migration
   - Mitigation: ship by feature area, not by individual string.

2. Inconsistent terminology
   - Mitigation: lock glossary first.

3. Over-abstracted i18n too early
   - Mitigation: keep it simple and Bokmal-first for now.

4. Legal/compliance wording drift
   - Mitigation: review high-trust screens separately from general UI copy.

## Priority Order

1. BKM1 terminology and foundation
2. BKM2 public discovery
3. BKM3 auth/account
4. BKM4 core workflows
5. BKM5 compliance/trust
6. BKM7 validation and system messaging
7. BKM6 admin operations
8. BKM8 SEO polish

## Definition of Done

We should consider Bokmal introduced when:
- all public user-facing surfaces are Bokmal-first
- all main signed-in workflows are Bokmal-first
- user-visible validation and success/error states are Bokmal-first
- only internal-only admin or low-priority leftovers remain in English
