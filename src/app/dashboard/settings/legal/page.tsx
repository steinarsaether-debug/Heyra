import { redirect } from "next/navigation";
import { ConsentType } from "@prisma/client";
import { auth } from "@/auth";
import { EmailVerificationCard } from "@/components/auth/email-verification-card";
import { LegalSettingsClient } from "@/components/legal/legal-settings-client";
import { NotificationSettingsClient } from "@/components/notifications/notification-settings-client";
import { LEGAL_VERSION } from "@/lib/legal";
import { prisma } from "@/lib/prisma";

function formatConsentType(type: ConsentType) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function LegalSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/settings/legal");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      consentRecords: {
        orderBy: {
          grantedAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Legal settings
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Review consent, verification, and policy status.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            This is the home for the parts of Phase 0 that should stay inspectable by real users: what they agreed to, which policy version is active, and whether their account is ready for key workflows.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <EmailVerificationCard email={user.email} isVerified={Boolean(user.emailVerified)} />
          <LegalSettingsClient />
        </div>

        <NotificationSettingsClient />

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Consent history
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Current legal version: {LEGAL_VERSION}
          </p>
          <div className="mt-4 grid gap-3">
            {user.consentRecords.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                No consent records found.
              </div>
            ) : (
              user.consentRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                >
                  {formatConsentType(record.type)} · version {record.version} · granted{" "}
                  {record.grantedAt.toLocaleDateString("nb-NO")}
                  {record.revokedAt
                    ? ` · revoked ${record.revokedAt.toLocaleDateString("nb-NO")}`
                    : " · active"}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
