"use client";

import { useState } from "react";

export function RunComplianceRemindersButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setIsRunning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/jobs/compliance-reminders", {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        summary?: {
          checked: number;
          queued: number;
          overdue: number;
          upcoming: number;
        };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke kjøre påminnelsesjobben.");
      }

      setMessage(
        `Kontrollerte ${data.summary?.checked ?? 0} oppgaver og la ${data.summary?.queued ?? 0} nye påminnelser i kø.`,
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Kunne ikke kjøre jobben.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleRun}
        className="rounded-xl bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white"
        disabled={isRunning}
      >
        {isRunning ? "Kjører påminnelsesjobb..." : "Kjør påminnelsesjobb nå"}
      </button>
      {message ? <p className="text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </div>
  );
}
