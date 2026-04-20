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
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] shadow-[0_28px_80px_rgba(16,42,33,0.12)] backdrop-blur-sm">
          <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.96),rgba(27,58,44,0.88))] px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
              Juridiske innstillinger
            </p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              Se samtykker, verifisering og gjeldende policystatus.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
              Her finner brukeren det som må være synlig og forståelig: hva de har samtykket til, hvilken policyversjon som gjelder, og om kontoen er klar for viktige arbeidsflyter.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <EmailVerificationCard email={user.email} isVerified={Boolean(user.emailVerified)} />
          <LegalSettingsClient />
        </div>

        <NotificationSettingsClient />

        <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Samtykkehistorikk
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Gjeldende juridisk versjon: {LEGAL_VERSION}
          </p>
          <div className="mt-4 grid gap-3">
            {user.consentRecords.length === 0 ? (
              <div className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                Ingen samtykkeregistreringer funnet.
              </div>
            ) : (
              user.consentRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
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
