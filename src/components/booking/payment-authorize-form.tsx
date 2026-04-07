"use client";

import { PaymentProvider } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPaymentProvider } from "@/lib/commerce";

export function PaymentAuthorizeForm({
  bookingId,
  providers,
}: {
  bookingId: string;
  providers: PaymentProvider[];
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<PaymentProvider>(providers[0] ?? PaymentProvider.STRIPE_SIMULATED);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ provider }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to authorize payment.");
      setIsWorking(false);
      return;
    }

    setIsWorking(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        value={provider}
        onChange={(event) => setProvider(event.target.value as PaymentProvider)}
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
      >
        {providers.map((option) => (
          <option key={option} value={option}>
            {formatPaymentProvider(option)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isWorking}
        className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isWorking ? "Authorizing..." : "Authorize payment"}
      </button>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </form>
  );
}
