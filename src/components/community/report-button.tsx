"use client";

import { useState } from "react";

export function ReportButton({
  kind,
  id,
}: {
  kind: "review" | "experience";
  id: string;
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReport() {
    setIsWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/${kind === "review" ? "reviews" : "experiences"}/${id}/report`, {
      method: "POST",
    });

    const data = (await response.json()) as { error?: string };
    setIsWorking(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to report this content.");
      return;
    }

    setMessage("Reported for moderator review.");
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleReport}
        disabled={isWorking}
        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-70"
      >
        {isWorking ? "Reporting..." : "Report"}
      </button>
      {message ? <p className="text-xs text-[#1f5c3d]">{message}</p> : null}
      {error ? <p className="text-xs text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
