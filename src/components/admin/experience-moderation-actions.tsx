"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExperienceModerationActions({
  experienceId,
  initialModeratorNotes,
}: {
  experienceId: string;
  initialModeratorNotes?: string | null;
}) {
  const router = useRouter();
  const [moderatorNotes, setModeratorNotes] = useState(initialModeratorNotes ?? "");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "approve" | "flag" | "reject") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/experiences/${experienceId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, moderatorNotes }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke moderere erfaringen.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <textarea
        value={moderatorNotes}
        onChange={(event) => setModeratorNotes(event.target.value)}
        rows={4}
        className="w-full min-w-[18rem] rounded-[1.1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
        placeholder="Valgfritt moderatnotat"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runAction("approve")}
          disabled={isWorking}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          Godkjenn
        </button>
        <button
          type="button"
          onClick={() => runAction("flag")}
          disabled={isWorking}
          className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Flagg
        </button>
        <button
          type="button"
          onClick={() => runAction("reject")}
          disabled={isWorking}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Avvis
        </button>
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
