"use client";

import { useEffect, useState } from "react";
import { COOKIE_CONSENT_STORAGE_KEY, LEGAL_VERSION, defaultCookieConsent, type CookieConsentState } from "@/lib/legal";

export function LegalSettingsClient() {
  const [consent, setConsent] = useState<CookieConsentState>(defaultCookieConsent);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CookieConsentState;
      setConsent(parsed);
    } catch {
      setConsent(defaultCookieConsent);
    }
  }, []);

  async function updateConsent(nextConsent: CookieConsentState) {
    setConsent(nextConsent);
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextConsent));

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

    setSaved("Innstillingene er oppdatert.");
    window.setTimeout(() => setSaved(null), 2500);
  }

  function toggle(key: "analytics" | "marketing") {
    const nextConsent = {
      ...consent,
      [key]: !consent[key],
      necessary: true,
      version: LEGAL_VERSION,
      updatedAt: new Date().toISOString(),
    } satisfies CookieConsentState;

    void updateConsent(nextConsent);
  }

  return (
    <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Innstillinger for informasjonskapsler
      </p>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
        <div className="rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
          Nødvendige informasjonskapsler er alltid aktivert for innlogging og grunnleggende appfunksjoner.
        </div>
        <label className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
          <span>Tillat analyseinformasjonskapsler</span>
          <input type="checkbox" checked={consent.analytics} onChange={() => toggle("analytics")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3">
          <span>Tillat synkronisering av markedsføringsvalg</span>
          <input type="checkbox" checked={consent.marketing} onChange={() => toggle("marketing")} />
        </label>
        <p className="text-sm text-[var(--muted)]">
          Lokal registrert juridisk versjon: {consent.version}
        </p>
        {saved ? <p className="text-sm text-[#1f5c3d]">{saved}</p> : null}
      </div>
    </section>
  );
}
