# Heyra Next Sprint Backlog

## Purpose

This is the execution version of the current remaining work after the completed
N1-N6 sequence.

## Completed sequence

The original `Now` sprint line has been substantially completed:

- `N1` Compliance foundation
- `N2` Compliance integrations without providers
- `N3` Geospatial discovery hardening
- `N4` Big-game governance hardening
- `N5` Service marketplace foundation
- `N6` Service trust and Norway gate preparation

Those sprints should now be treated as delivered baseline, not upcoming work.

## Sprint X1: Compliance reminders and jobs

### Goal

Make compliance time-based, not only event-based.

### Tickets

1. Add a jobs/reminder scheduling layer.
2. Add annual reporting reminders.
3. Add `Sett og skutt` reminder scheduling.
4. Add booking-driven CWD and reporting reminders.
5. Add upcoming/overdue visibility in dashboard surfaces.
6. Add admin visibility for reminder/job issues.

### Exit criteria

- reminders are generated without manual action
- users can see upcoming and overdue compliance work

## Sprint X2: User management expansion

### Goal

Make users inspectable and manageable from the admin panel.

### Tickets

1. Add `/admin/users`.
2. Add search and filters for role, status, verification, and provider state.
3. Add `/admin/users/[id]`.
4. Show notes, audit, trust, bookings, properties, services, disputes, and compliance context.
5. Add review/suspend/reactivate actions.
6. Add self-serve account center under `/dashboard/settings/account`.

### Exit criteria

- admins can find and inspect users quickly
- users can understand their own account state

## Sprint X3: Language completion

### Goal

Finish the most visible remaining Bokmal and English cleanup.

### Tickets

1. Translate remaining admin surfaces.
2. Translate compliance and moderation copy.
3. Translate user-visible validation and API response messages.
4. Translate notification titles and bodies.
5. Remove mixed-language leftovers from property, listing, booking, and service flows.
6. Review English so it is a clean second language, not a partial fallback.

### Exit criteria

- Bokmal feels complete in all major user and admin flows
- English no longer leaks Norwegian domain terms unexpectedly

## Sprint X4: Bundled commerce foundation

### Goal

Prepare bundled listing + service checkout as the next product lane.

### Tickets

1. Define the cart model for listing booking plus service add-ons.
2. Add bundled checkout data structures.
3. Build summary UI for booking + services.
4. Add split-payout logic in the local-first commerce layer.
5. Document the provider-hardening path for real transfers later.

### Exit criteria

- the platform can model bundled purchases coherently
- checkout can expand beyond listing-only flows

## Sprint X5: Fishing lane maturity

### Goal

Make fishing-specific journeys feel purpose-built, not adapted from hunting.

### Tickets

1. Add clearer fishing listing templates.
2. Add water-specific rule structures.
3. Improve proof-of-licence presentation.
4. Improve in-field guidance near water/area boundaries.
5. Improve instant-fishing conversion on nearby discovery surfaces.

### Exit criteria

- fishing no longer feels like a secondary use of the hunting workflow

## Suggested execution order

1. `X1` Compliance reminders and jobs
2. `X2` User management expansion
3. `X3` Language completion
4. `X4` Bundled commerce foundation
5. `X5` Fishing lane maturity

## Notes

- Provider integrations still stay out of these sprints unless credentials and contracts are available.
- Bokmal-first remains the default, but English cleanup now matters because the language switcher is live.
- If launch/testing pressure spikes, Playwright and launch-hardening work can temporarily jump ahead of `X4`.
