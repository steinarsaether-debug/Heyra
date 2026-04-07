# GDPR Audit Checklist

## Data-flow areas

- Account creation and role selection
- Consent capture and revocation
- User profile and `UserPii`
- Booking, contract, invoice, and payment records
- Reviews, hunter experiences, disputes, and moderation notes
- Notification preferences and notification outbox
- Marketing attribution and share campaigns

## Audit checklist

- Confirm each user-facing flow has a clear legal basis and retention expectation.
- Confirm privacy and terms versions are stored on signup and legal settings changes.
- Review `UserPii` separation from the broader user record.
- Confirm cookie preferences can be changed after the first banner interaction.
- Confirm dispute and review moderation notes are access-limited to admins.
- Confirm exported documents do not expose unrelated users' PII.
- Review local and offline storage surfaces for minimization and clear user expectations.
- Confirm password reset and email verification tokens expire and cannot be reused.
- Review whether `vald` governance notes or quota notes can contain unnecessary personal data.

## DPO review pack

- Privacy policy page
- Terms page
- Consent settings page
- Data model summary from `prisma/schema.prisma`
- Screenshot walk-through of signup, profile, booking, disputes, and moderation

## Open launch blockers

- External storage and email providers need processor and joint-controller review once chosen.
- Final retention and deletion policy still needs explicit product copy and operations procedure.
