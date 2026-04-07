"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContractSignActions({
  bookingId,
  canSignAsHunter,
  canSignAsLandowner,
  hunterSignedAt,
  landownerSignedAt,
}: {
  bookingId: string;
  canSignAsHunter: boolean;
  canSignAsLandowner: boolean;
  hunterSignedAt: string | null;
  landownerSignedAt: string | null;
}) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "sign_hunter" | "sign_landowner") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        responseMessage: "",
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to record the signature.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
        <p>Hunter signature: {hunterSignedAt ? "Recorded" : "Pending"}</p>
        <p>Landowner signature: {landownerSignedAt ? "Recorded" : "Pending"}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {canSignAsHunter && !hunterSignedAt ? (
          <button
            type="button"
            onClick={() => runAction("sign_hunter")}
            disabled={isWorking}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            Sign as hunter
          </button>
        ) : null}
        {canSignAsLandowner && !landownerSignedAt ? (
          <button
            type="button"
            onClick={() => runAction("sign_landowner")}
            disabled={isWorking}
            className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
          >
            Sign as landowner
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
