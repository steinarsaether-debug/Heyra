# Heyra Demo Users

These demo accounts are meant for local and staging-style testing only.

Shared password for all demo users:

- `HeyraDemo2026!`

## Core personas

- `admin@heyra.local`
  - Internal moderation and compliance testing
  - Use this account to inspect the separate `/admin` panel
- `landowner@heyra.local`
  - Landowner flow with properties, listings, payouts, marketing, and shared-governance examples
  - Includes:
    - one `vald`-managed hunting offer
    - one low-confidence hunting offer pending review
    - one instant fishing offer
- `hunter@heyra.local`
  - Hunter / angler flow with requested, approved, confirmed, and completed bookings
  - Includes:
    - a booking request
    - an approved booking that still needs shared follow-up
    - a confirmed fishing booking
    - completed trips with reviews and experience posts
- `service@heyra.local`
  - Approved service provider with a published service
- `service-pending@heyra.local`
  - Pending provider profile and pending service for admin review testing

## What the seeded environment is meant to show

- `Utforsk`
  - Published hunting and fishing listings with realistic Norwegian municipalities and species
  - Nearby fishing and map-friendly listings with saved property center points
- `Turer`
  - Bookings in several statuses
  - Licence and field-use testing
  - Compliance tasks tied to active and completed trips
- `Tjenester`
  - Public services
  - Approved and pending provider examples
- `Mer`
  - Profile, alerts, legal, landowner tools, provider tools, and admin entry for admins only
- `/admin`
  - pending listing review
  - pending provider review
  - pending service review
  - flagged review / flagged experience
  - open dispute
  - mixed compliance task states

## Seed modes

- `npm run seed:demo`
  - Clears existing demo users and rebuilds the full realistic demo dataset
- `npm run seed:demo:lite`
  - Clears existing demo users and rebuilds a lighter demo set
- `npm run seed:demo:reset`
  - Removes demo users and demo-only seeded content without recreating it

## Safety note

The seed script only removes and recreates the known demo users and the demo CWD zone. It does not wipe the whole database.
