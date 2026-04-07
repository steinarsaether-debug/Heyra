"use client";

import { useMemo, useState } from "react";

type OfflineLink = {
  href: string;
  label: string;
};

const STORAGE_KEY = "heyra-offline-links";

export function OfflineSaveLinks({
  scope,
  links,
}: {
  scope: string;
  links: OfflineLink[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const dedupedLinks = useMemo(
    () => links.filter((link, index) => links.findIndex((item) => item.href === link.href) === index),
    [links],
  );

  async function saveLinks() {
    if (!("caches" in window)) {
      setMessage("This browser does not support offline caching.");
      return;
    }

    try {
      const cache = await caches.open("heyra-v2");
      await Promise.all(dedupedLinks.map((link) => cache.add(link.href)));

      const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string[]>;
      existing[scope] = dedupedLinks.map((link) => link.href);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

      setMessage("Saved for offline use on this device.");
      window.setTimeout(() => setMessage(null), 2500);
    } catch (error) {
      console.error("Offline save failed", error);
      setMessage("Could not save these links for offline use.");
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Offline field pack
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Save the key pages and documents you are likely to need if coverage drops during travel or while you are on the property.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--foreground)]">
        {dedupedLinks.map((link) => (
          <li key={link.href} className="rounded-2xl border border-[var(--border)] px-4 py-3">
            {link.label}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void saveLinks()}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
        >
          Save these offline
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
