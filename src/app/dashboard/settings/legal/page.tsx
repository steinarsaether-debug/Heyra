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
            Juridiske innstillinger
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Se samtykker, verifisering og gjeldende policystatus.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Her finner brukeren det som må være synlig og forståelig: hva de har samtykket til, hvilken policyversjon som gjelder, og om kontoen er klar for viktige arbeidsflyter.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <EmailVerificationCard email={user.email} isVerified={Boolean(user.emailVerified)} />
          <LegalSettingsClient />
        </div>

        <NotificationSettingsClient />

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Samtykkehistorikk
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Gjeldende juridisk versjon: {LEGAL_VERSION}
          </p>
          <div className="mt-4 grid gap-3">
            {user.consentRecords.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                Ingen samtykkeregistreringer funnet.
              </div>
            ) : (
              user.consentRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                >
                  {formatConsentType(record.type)} · versjon {record.version} · gitt{" "}
                  {record.grantedAt.toLocaleDateString("nb-NO")}
                  {record.revokedAt
                    ? ` · trukket tilbake ${record.revokedAt.toLocaleDateString("nb-NO")}`
                    : " · aktivt"}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
