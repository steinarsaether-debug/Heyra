"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ServiceReviewActions({
  serviceId,
  initialReviewerNotes,
}: {
  serviceId: string;
  initialReviewerNotes?: string | null;
}) {
  const router = useRouter();
  const [reviewerNotes, setReviewerNotes] = useState(initialReviewerNotes ?? "");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "publish" | "revert_to_draft" | "archive") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/services/${serviceId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, reviewerNotes }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to update the service.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Reviewer notes
        <textarea
          value={reviewerNotes}
          onChange={(event) => setReviewerNotes(event.target.value)}
          rows={4}
          className="w-full min-w-[18rem] rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Explain why the service is ready, or what must change before publish."
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runAction("publish")}
          disabled={isWorking}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => runAction("revert_to_draft")}
          disabled={isWorking}
          className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Send back to draft
        </button>
        <button
          type="button"
          onClick={() => runAction("archive")}
          disabled={isWorking}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Archive
        </button>
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
