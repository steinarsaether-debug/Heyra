"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ComplianceTaskActions({
  taskId,
  status,
}: {
  taskId: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "start" | "complete" | "dismiss" | "reopen") {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/compliance/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Vi kunne ikke oppdatere etterlevelsesoppgaven.");
        return;
      }

      router.refresh();
    } catch {
      setError("Vi kunne ikke oppdatere etterlevelsesoppgaven.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {(status === "OPEN" || status === "DISMISSED") && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void submit(status === "DISMISSED" ? "reopen" : "start")}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] disabled:opacity-60"
        >
          {status === "DISMISSED" ? "Åpne igjen" : "Start"}
        </button>
      )}
      {(status === "OPEN" || status === "IN_PROGRESS") && (
        <>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit("complete")}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
          >
            Fullfør
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit("dismiss")}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] disabled:opacity-60"
          >
            Avslutt
          </button>
        </>
      )}
      {error ? <p className="w-full text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
