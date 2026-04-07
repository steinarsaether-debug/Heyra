"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewRecord = {
  id: string;
  rating: number;
  title: string;
  body: string;
  isFlagged: boolean;
  moderationStatus: "PENDING" | "APPROVED" | "FLAGGED" | "REJECTED";
  moderatorNotes: string | null;
} | null;

export function ReviewForm({
  bookingId,
  heading,
  existingReview,
}: {
  bookingId: string;
  heading: string;
  existingReview: ReviewRecord;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(String(existingReview?.rating ?? 5));
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [flagForReview, setFlagForReview] = useState(existingReview?.isFlagged ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/bookings/${bookingId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating,
        title,
        body,
        flagForReview,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save the review.");
      return;
    }

    setSuccess("Review saved and sent for moderation.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.7rem] border border-[var(--border)] bg-white/80 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Booking review
        </p>
        <h2 className="mt-3 text-3xl text-[var(--forest)]">{heading}</h2>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
          Keep this practical and respectful. Focus on the experience, communication, and what another person should realistically expect.
        </p>
      </div>

      {existingReview?.moderatorNotes ? (
        <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
          Moderator note: {existingReview.moderatorNotes}
        </div>
      ) : null}

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Rating
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Short title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Example: Clear communication and practical arrival details"
        />
      </label>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Review
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Describe what worked well, what was unclear, and what another hunter or landowner should know."
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={flagForReview}
          onChange={(event) => setFlagForReview(event.target.checked)}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Flag this review for moderator attention because it may contain sensitive context
      </label>

      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSaving ? "Saving..." : existingReview ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
