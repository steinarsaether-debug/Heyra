# Language Architecture

## Current approach

Heyra now uses a locale foundation that is designed for:
- Bokmal-first rollout now
- incremental translation by feature area
- additional languages later without a routing rewrite

## Key pieces

- supported locale registry in [src/lib/i18n/config.ts](/Users/steinar/claude/heyra/src/lib/i18n/config.ts)
- message dictionaries in [src/lib/i18n/messages](/Users/steinar/claude/heyra/src/lib/i18n/messages)
- request locale resolution in [src/lib/i18n/request.ts](/Users/steinar/claude/heyra/src/lib/i18n/request.ts)
- translation helper in [src/lib/i18n/translate.ts](/Users/steinar/claude/heyra/src/lib/i18n/translate.ts)
- client locale provider in [src/components/i18n/locale-provider.tsx](/Users/steinar/claude/heyra/src/components/i18n/locale-provider.tsx)
- language switcher in [src/components/i18n/language-switcher.tsx](/Users/steinar/claude/heyra/src/components/i18n/language-switcher.tsx)
- locale-aware middleware in [middleware.ts](/Users/steinar/claude/heyra/middleware.ts)

## URL strategy

- default locale: no prefix, example `/listings`
- non-default locales: prefixed URLs, example `/en/listings`
- middleware rewrites prefixed URLs to the internal route structure while preserving the user-facing URL

This keeps the current app structure stable while making room for future locale URLs.

## Rollout strategy

1. Bokmal dictionaries first
2. migrate shared shell and homepage
3. migrate feature areas one by one
4. add real locale-specific message files for `nn`, `en`, `sv`, `da`, `fi`, `de`
5. only then consider a dedicated localization library migration if the app outgrows the current helper model

## Next steps

- replace fallback Bokmal reuse for other locales with real message files
- localize auth, dashboard, listings, bookings, compliance, and services
- localize validation and API messaging
- add locale-aware metadata alternates once more than one language has real content
