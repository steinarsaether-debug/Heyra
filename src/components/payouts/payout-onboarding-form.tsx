"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayoutOnboardingForm({ isReady }: { isReady: boolean }) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsWorking(true);
    setError(null);

    const response = await fetch("/api/payout-onboarding", {
      method: "POST",
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to update payout onboarding.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  if (isReady) {
    return (
      <p className="text-sm leading-7 text-[#1f5c3d]">
        Simulated payout onboarding is complete for this account.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isWorking}
        className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isWorking ? "Saving..." : "Complete simulated onboarding"}
      </button>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
