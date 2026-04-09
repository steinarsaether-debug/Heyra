"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ServiceProviderReviewActions({
  profileId,
  initialModerationNotes,
}: {
  profileId: string;
  initialModerationNotes?: string | null;
}) {
  const router = useRouter();
  const [moderationNotes, setModerationNotes] = useState(initialModerationNotes ?? "");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "approve" | "flag") {
    setIsWorking(true);
    setError(null);

    const response = await fetch("/api/service-provider/profile/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileId, action, moderationNotes }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke oppdatere leverandørstatus.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Notater om leverandørgjennomgang
        <textarea
          value={moderationNotes}
          onChange={(event) => setModerationNotes(event.target.value)}
          rows={4}
          className="w-full min-w-[18rem] rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Skriv hva som er kontrollert, eller hva som fortsatt må avklares."
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runAction("approve")}
          disabled={isWorking}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          Godkjenn profil
        </button>
        <button
          type="button"
          onClick={() => runAction("flag")}
          disabled={isWorking}
          className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
        >
          Flagg for oppfølging
        </button>
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
