# Heyra User Management Backlog

## Goal

Create a practical user-management track for:
- admin operations
- trust and compliance oversight
- self-serve account management
- safer future moderation and support work

## Sequence

### UM1: Foundation

Goal:
Add the core schema and auth foundation for managed accounts.

Tickets:
1. Add `UserStatus` to Prisma.
2. Add user lifecycle fields:
   - `status`
   - `statusReason`
   - `suspendedAt`
   - `deactivatedAt`
3. Add `AdminUserNote`.
4. Add `AdminAuditLog`.
5. Add shared admin-audit helper functions.
6. Update auth so suspended/deactivated users cannot sign in normally.
7. Add typed session/token support for user status.

Exit criteria:
- user lifecycle state exists in the schema
- admin notes and audit log exist in the schema
- auth respects user status

### UM2: Admin directory

Goal:
Give admins a searchable user list.

Tickets:
1. Add `/dashboard/admin/users`.
2. Add search by name/email.
3. Add filters for:
   - role
   - status
   - email verified
   - provider profile
4. Add summary cards for:
   - active users
   - suspended users
   - flagged providers
   - users needing review

Exit criteria:
- admins can find and filter users quickly

### UM3: Admin user detail and actions

Goal:
Make one user fully inspectable and manageable.

Tickets:
1. Add `/dashboard/admin/users/[id]`.
2. Show profile, role, status, and trust state.
3. Show bookings, properties, services, reviews, disputes, and compliance summary.
4. Add admin notes UI.
5. Add role/status actions:
   - mark for review
   - suspend
   - reactivate
6. Write all actions to audit log.

Exit criteria:
- admins can inspect and act on one user safely

### UM4: Self-serve account center

Goal:
Make users understand and manage their own account state.

Tickets:
1. Add `/dashboard/settings/account`.
2. Show:
   - account role
   - status
   - email verification
   - provider review state if relevant
3. Link password reset and legal/settings surfaces.
4. Add consent history summary.
5. Add account lifecycle guidance if flagged or suspended.

Exit criteria:
- users can see their own account state clearly

### UM5: Hardening

Goal:
Make user management safe enough for routine operations.

Tickets:
1. Add tests for role/status transitions.
2. Add tests for auth gating by status.
3. Add tests for audit log writes.
4. Add central helpers for role + status checks.
5. Add safe defaults for suspended/deactivated users across dashboard actions.

Exit criteria:
- user-management actions are covered by tests and consistent policy checks

## Notes

- Use soft suspension, not deletion.
- Keep public trust and internal moderation separate.
- Do not add impersonation in this track.
- Treat role and lifecycle status as different concerns.
