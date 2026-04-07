"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COOKIE_CONSENT_STORAGE_KEY, defaultCookieConsent, LEGAL_VERSION, type CookieConsentState } from "@/lib/legal";

function buildConsentState(partial: Pick<CookieConsentState, "analytics" | "marketing">) {
  return {
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    version: LEGAL_VERSION,
    updatedAt: new Date().toISOString(),
  } satisfies CookieConsentState;
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CookieConsentState;
        setConsent(parsed.version === LEGAL_VERSION ? parsed : null);
      } catch {
        setConsent(null);
      }
    }

    setMounted(true);
  }, []);

  async function saveConsent(nextConsent: CookieConsentState) {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextConsent));
    setConsent(nextConsent);

    await fetch("/api/consent", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analytics: nextConsent.analytics,
        marketing: nextConsent.marketing,
      }),
    });
  }

  if (!mounted || consent) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-[1.6rem] border border-[var(--border)] bg-white/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Informasjonskapsler
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
            Heyra bruker nødvendige informasjonskapsler for innlogging og grunnleggende funksjoner. Du kan også velge analyse og markedsføring nå, og endre valgene senere under juridiske innstillinger.
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Les mer i <Link href="/legal/privacy" className="font-semibold text-[var(--forest)]">personvernerklæringen</Link> og <Link href="/legal/terms" className="font-semibold text-[var(--forest)]">vilkårene</Link>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveConsent(buildConsentState({ analytics: false, marketing: false }))}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Kun nødvendige
          </button>
          <button
            type="button"
            onClick={() => void saveConsent(buildConsentState({ analytics: true, marketing: false }))}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Tillat analyse
          </button>
          <button
            type="button"
            onClick={() => void saveConsent(buildConsentState({ analytics: true, marketing: true }))}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
          >
            Tillat alle
          </button>
        </div>
      </div>
    </div>
  );
}
