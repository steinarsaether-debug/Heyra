# Vald And Jaktfelt Decision

## Decision

For the current Norway-first phase, Heyra keeps `Vald` as the primary shared-governance model and does **not** add a separate `Jaktfelt` model yet.

## Why

- `Vald` already captures the most important product risk we have learned: one property owner often cannot independently promise big-game access, quota, or timing.
- The current booking and listing problems are governance and quota clarity problems more than geometry problems.
- Adding `Jaktfelt` too early would increase model complexity before we have evidence that users need a distinct operational unit inside the same `Vald`.

## What must still be true

- Big-game listings on properties inside a `Vald` should normally be `VALD_MANAGED`.
- Listings must explain:
  - who approves access
  - what quota is actually still available
  - who handles reporting after the trip
- Bookings that need shared confirmation should not look fully approved before that confirmation is recorded.

## Revisit trigger

Introduce `Jaktfelt` only if one or more of these becomes common:

- different sub-areas inside the same `Vald` have materially different quota/permit behavior
- landowners routinely need separate map boundaries and calendars inside one `Vald`
- hunters need to understand a named operational hunt area that is more specific than the public property polygon
- admin review and compliance workflows start depending on a distinct sub-area concept

## Current implementation direction

- `Property` remains the spatial/public object
- `Vald` remains the shared-governance object
- big-game listings are hardened around `Vald` governance, quota availability, and reporting responsibility before a `Jaktfelt` split is considered
