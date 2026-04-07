# OWASP Top 10 Review

## Scope

- Public listing and fishing discovery surfaces
- Authentication and onboarding
- Booking, contract, payment, and dispute flows
- Admin review and moderation routes

## Current controls

- SQL injection:
  Prisma is the default data layer, and raw SQL usage is limited to explicit PostGIS queries where parameters are still bound.
- XSS:
  React and Next.js escaping is the default. Any `dangerouslySetInnerHTML` usage should stay restricted to generated JSON-LD.
- Auth bypass:
  Session checks exist in protected routes and API handlers, plus middleware-based RBAC for dashboard and admin areas.
- File uploads:
  Listing photo uploads validate size and file type before local storage.
- Secrets:
  Local builds still fall back to a dev `AUTH_SECRET`; production must override this.

## Review checklist

- Verify every `prisma.$queryRaw` call still uses bound parameters only.
- Review all public-to-admin transitions for missing role checks.
- Check that every mutation route rejects unauthenticated access first.
- Confirm report, review, and dispute routes cannot be replayed across unrelated resources.
- Confirm photo uploads reject executable content and unexpected mime types.
- Review cookie, consent, and email-verification flows for account takeover shortcuts.
- Test booking and payment transitions for impossible state changes.
- Review marketing attribution inputs for unbounded storage or reflected content.

## Open launch blockers

- Replace local `AUTH_SECRET` fallback in production environments.
- Run manual auth-bypass checks on every admin route before beta.
- Run Playwright smoke coverage on every CI build.
