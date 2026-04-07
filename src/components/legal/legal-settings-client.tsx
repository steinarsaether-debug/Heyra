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

    setSaved("Preferences updated.");
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
    <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Cookie preferences
      </p>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
        <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
          Necessary cookies are always enabled for sign-in and core app functionality.
        </div>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Allow analytics cookies</span>
          <input type="checkbox" checked={consent.analytics} onChange={() => toggle("analytics")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Allow marketing preference syncing</span>
          <input type="checkbox" checked={consent.marketing} onChange={() => toggle("marketing")} />
        </label>
        <p className="text-sm text-[var(--muted)]">
          Legal version tracked locally: {consent.version}
        </p>
        {saved ? <p className="text-sm text-[#1f5c3d]">{saved}</p> : null}
      </div>
    </section>
  );
}
