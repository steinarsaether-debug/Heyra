"use client";

import { useEffect, useState } from "react";
import { getNotificationDeliveryStatus } from "@/lib/notification-preferences";

type PreferenceState = {
  bookingUpdates: boolean;
  contractUpdates: boolean;
  payoutUpdates: boolean;
  complianceReminders: boolean;
  marketingUpdates: boolean;
  pushEnabled: boolean;
  pushPermission: string;
};

const defaultState: PreferenceState = {
  bookingUpdates: true,
  contractUpdates: true,
  payoutUpdates: true,
  complianceReminders: true,
  marketingUpdates: false,
  pushEnabled: false,
  pushPermission: "default",
};

export function NotificationSettingsClient() {
  const [preferences, setPreferences] = useState<PreferenceState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      const response = await fetch("/api/notifications/preferences");
      const data = (await response.json()) as { preference?: PreferenceState };

      if (response.ok && data.preference) {
        setPreferences({
          ...data.preference,
          pushPermission:
            typeof window !== "undefined" && "Notification" in window
              ? Notification.permission
              : data.preference.pushPermission ?? "default",
        });
      }

      setIsLoading(false);
    }

    void loadPreferences();
  }, []);

  async function savePreferences(nextState: PreferenceState, markTested = false) {
    setPreferences(nextState);
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nextState,
        markTested,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke lagre varslingsinnstillingene.");
      return;
    }

    setMessage(markTested ? "Testvarsel sendt." : "Varslingsinnstillingene er oppdatert.");
    window.setTimeout(() => setMessage(null), 2500);
  }

  function toggle(key: keyof PreferenceState) {
    const nextState = {
      ...preferences,
      [key]: !preferences[key],
    };

    void savePreferences(nextState);
  }

  async function enablePush() {
    if (!("Notification" in window)) {
      setError("Denne nettleseren støtter ikke varsler.");
      return;
    }

    const permission = await Notification.requestPermission();
    const nextState = {
      ...preferences,
      pushEnabled: permission === "granted",
      pushPermission: permission,
    };

    await savePreferences(nextState);
  }

  async function sendTestNotification() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      setError("Denne nettleseren støtter ikke lokale varsler.");
      return;
    }

    if (Notification.permission !== "granted") {
      setError("Tillat nettleservarsler først.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Heyra test notification", {
      body: "Local push scaffolding is working on this device.",
      tag: "heyra-test-notification",
    });

    await savePreferences(
      {
        ...preferences,
        pushEnabled: true,
        pushPermission: Notification.permission,
      },
      true,
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-sm leading-7 text-[var(--muted)]">Laster varslingsinnstillinger...</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Varsler
      </p>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Oppdateringer om bestillinger</span>
          <input type="checkbox" checked={preferences.bookingUpdates} onChange={() => toggle("bookingUpdates")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Oppdateringer om kontrakt og betaling</span>
          <input type="checkbox" checked={preferences.contractUpdates} onChange={() => toggle("contractUpdates")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Oppdateringer om utbetalinger</span>
          <input type="checkbox" checked={preferences.payoutUpdates} onChange={() => toggle("payoutUpdates")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Påminnelser om etterlevelse</span>
          <input type="checkbox" checked={preferences.complianceReminders} onChange={() => toggle("complianceReminders")} />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3">
          <span>Markedsføringsoppdateringer</span>
          <input type="checkbox" checked={preferences.marketingUpdates} onChange={() => toggle("marketingUpdates")} />
        </label>
        <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
          <p className="font-semibold">Nettleservarsler</p>
          <p className="mt-1 text-[var(--muted)]">
            {getNotificationDeliveryStatus(preferences.pushEnabled, preferences.pushPermission)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void enablePush()}
              disabled={isSaving}
              className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              Aktiver varsler
            </button>
            <button
              type="button"
              onClick={() => void sendTestNotification()}
              disabled={isSaving || preferences.pushPermission !== "granted"}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
            >
              Send testvarsel
            </button>
          </div>
        </div>
        {message ? <p className="text-sm text-[#1f5c3d]">{message}</p> : null}
        {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      </div>
    </section>
  );
}
