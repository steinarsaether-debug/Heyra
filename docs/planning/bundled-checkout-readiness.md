# Bundled Checkout Readiness

## Status

Not ready to enter execution yet.

## Why

The service marketplace now has:
- provider profiles
- service moderation
- public discovery
- nearby-service integration on listing pages

It does **not** yet have:
- a cart model for service add-ons
- a service reservation lifecycle
- service fulfilment states
- pricing rules for bundled purchase
- provider-side acceptance/availability logic

## Decision

Keep bundled checkout in the `Next` backlog, not the active `Now` track.

## Trigger to move it forward

Move bundled checkout into execution only when all of these are true:
- at least two service categories have real published providers
- the nearby-service layer is actively used during listing discovery
- provider review and trust surfaces are stable
- we can define whether services are:
  - inquiry only
  - reservable
  - or directly purchasable alongside a booking
