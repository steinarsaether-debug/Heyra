"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DisputeActions({
  disputeId,
  initialNotes,
}: {
  disputeId: string;
  initialNotes?: string | null;
}) {
  const router = useRouter();
  const [resolutionNotes, setResolutionNotes] = useState(initialNotes ?? "");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runStatus(status: "UNDER_REVIEW" | "RESOLVED" | "CLOSED") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/disputes/${disputeId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, resolutionNotes }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke oppdatere tvistesaken.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <textarea
        value={resolutionNotes}
        onChange={(event) => setResolutionNotes(event.target.value)}
        rows={4}
        className="w-full min-w-[18rem] rounded-[1.1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
        placeholder="Moderatornotater eller oppsummering av løsning"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runStatus("UNDER_REVIEW")}
          disabled={isWorking}
          className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Under gjennomgang
        </button>
        <button
          type="button"
          onClick={() => runStatus("RESOLVED")}
          disabled={isWorking}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          Løs
        </button>
        <button
          type="button"
          onClick={() => runStatus("CLOSED")}
          disabled={isWorking}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Lukk
        </button>
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
