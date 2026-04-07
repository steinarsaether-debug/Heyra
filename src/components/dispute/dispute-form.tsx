"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DisputeForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/bookings/${bookingId}/disputes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to open dispute ticket.");
      return;
    }

    setSuccess("Dispute ticket opened for moderator follow-up.");
    setTitle("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Booking dispute
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Use this when a completed or cancelled trip needs moderator follow-up beyond a normal review.
        </p>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
        placeholder="Short dispute title"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={5}
        className="w-full rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
        placeholder="Describe what happened, what is disputed, and what follow-up you need."
      />
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSubmitting ? "Opening..." : "Open dispute ticket"}
      </button>
    </form>
  );
}
