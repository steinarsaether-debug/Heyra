"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExperienceRecord = {
  id: string;
  title: string;
  summary: string;
  areaQualityNotes: string | null;
  accessNotes: string | null;
  localServicesNotes: string | null;
  accommodationNotes: string | null;
  safetyNotes: string | null;
  moderationStatus: "PENDING" | "APPROVED" | "FLAGGED" | "REJECTED";
  moderatorNotes: string | null;
} | null;

export function HunterExperienceForm({
  bookingId,
  listingTitle,
  existingExperience,
}: {
  bookingId: string;
  listingTitle: string;
  existingExperience: ExperienceRecord;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existingExperience?.title ?? "");
  const [summary, setSummary] = useState(existingExperience?.summary ?? "");
  const [areaQualityNotes, setAreaQualityNotes] = useState(existingExperience?.areaQualityNotes ?? "");
  const [accessNotes, setAccessNotes] = useState(existingExperience?.accessNotes ?? "");
  const [localServicesNotes, setLocalServicesNotes] = useState(existingExperience?.localServicesNotes ?? "");
  const [accommodationNotes, setAccommodationNotes] = useState(existingExperience?.accommodationNotes ?? "");
  const [safetyNotes, setSafetyNotes] = useState(existingExperience?.safetyNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/bookings/${bookingId}/experience`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        summary,
        areaQualityNotes,
        accessNotes,
        localServicesNotes,
        accommodationNotes,
        safetyNotes,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to save your hunter experience.");
      return;
    }

    setSuccess("Experience saved and sent for moderation.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.7rem] border border-[var(--border)] bg-white/80 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          Hunter experience
        </p>
        <h2 className="mt-3 text-3xl text-[var(--forest)]">Share what helped on {listingTitle}.</h2>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted)]">
          Focus on practical information that helps the next hunter prepare well. Avoid sharing private landowner details, exact sensitive locations, or anything that should stay inside the group.
        </p>
      </div>

      {existingExperience?.moderatorNotes ? (
        <div className="rounded-[1.4rem] border border-[#d8c4a0] bg-[#fff9ef] px-5 py-4 text-sm leading-7 text-[#6b5432]">
          Moderator note: {existingExperience.moderatorNotes}
        </div>
      ) : null}

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Short title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Example: Easy access, good dog-handler options nearby"
        />
      </label>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Overall summary
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={5}
          className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Describe what was useful to know before the trip, what worked well, and what another hunter should plan for."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Area quality
          <textarea
            value={areaQualityNotes}
            onChange={(event) => setAreaQualityNotes(event.target.value)}
            rows={4}
            className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
            placeholder="Terrain, visibility, water conditions, fish activity, or other practical impressions."
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Access and parking
          <textarea
            value={accessNotes}
            onChange={(event) => setAccessNotes(event.target.value)}
            rows={4}
            className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
            placeholder="Road quality, parking, walking time, gates, or river entry points."
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Local services
          <textarea
            value={localServicesNotes}
            onChange={(event) => setLocalServicesNotes(event.target.value)}
            rows={4}
            className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
            placeholder="Helpful dog handlers, butchers, shops, guides, or local support."
          />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Accommodation and comfort
          <textarea
            value={accommodationNotes}
            onChange={(event) => setAccommodationNotes(event.target.value)}
            rows={4}
            className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
            placeholder="Cabins, drying space, food, mobile coverage, or practical comfort notes."
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Safety and local advice
        <textarea
          value={safetyNotes}
          onChange={(event) => setSafetyNotes(event.target.value)}
          rows={4}
          className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Weather, river safety, communication issues, local etiquette, or anything another hunter/fisher should take seriously."
        />
      </label>

      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSaving ? "Saving..." : existingExperience ? "Update experience" : "Submit experience"}
      </button>
    </form>
  );
}
