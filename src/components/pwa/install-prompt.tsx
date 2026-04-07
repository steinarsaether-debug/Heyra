"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 rounded-[1.4rem] border border-[var(--border)] bg-white/95 p-4 shadow-[0_16px_40px_rgba(16,42,33,0.18)] sm:left-auto sm:right-8 sm:w-[24rem]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
        Install Heyra
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
        Save Heyra to your home screen for faster access when you are traveling with weak coverage.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
          }}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
        >
          Install app
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
