"use client";

import { CancellationPolicy, ListingGovernanceModel, ListingType, SharedApprovalStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCancellationPolicy } from "@/lib/listing-view";
import {
  mergeShareAttribution,
  normalizeStoredShareAttribution,
  SHARE_STORAGE_PREFIX,
} from "@/lib/share-attribution";

export function RequestBookingForm({
  listingId,
  listingType,
  instantBookEnabled,
  cancellationPolicy,
  governanceModel,
  coApprovalRequired,
  governanceNotes,
  valdName,
  representativeConfirmationStatus,
  quotaSummary,
  availabilitySummary,
  permitNotes,
  reportingNotes,
  reportingResponsibility,
  speciesRestrictions,
  gearRules,
  bagLimitNotes,
  areaNotes,
  requiresNationalFishingLicense,
}: {
  listingId: string;
  listingType: ListingType;
  instantBookEnabled: boolean;
  cancellationPolicy: CancellationPolicy;
  governanceModel: ListingGovernanceModel;
  coApprovalRequired: boolean;
  governanceNotes: string | null;
  valdName: string | null;
  representativeConfirmationStatus: SharedApprovalStatus | null;
  quotaSummary: string;
  availabilitySummary: string;
  permitNotes: string;
  reportingNotes: string;
  reportingResponsibility: string;
  speciesRestrictions: string;
  gearRules: string;
  bagLimitNotes: string;
  areaNotes: string;
  requiresNationalFishingLicense: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [attestedHunterFee, setAttestedHunterFee] = useState(false);
  const [attestedFishingRules, setAttestedFishingRules] = useState(false);
  const [firstTouchShareSource, setFirstTouchShareSource] = useState("");
  const [firstTouchShareCampaign, setFirstTouchShareCampaign] = useState("");
  const [lastTouchShareSource, setLastTouchShareSource] = useState("");
  const [lastTouchShareCampaign, setLastTouchShareCampaign] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `${SHARE_STORAGE_PREFIX}:${listingId}`;
    const sourceFromUrl = searchParams.get("share_source")?.trim() ?? "";
    const campaignFromUrl = searchParams.get("share_campaign")?.trim() ?? "";

    if (sourceFromUrl || campaignFromUrl) {
      const saved = normalizeStoredShareAttribution(
        JSON.parse(window.localStorage.getItem(storageKey) ?? "{}"),
      );
      const merged = mergeShareAttribution(saved, {
        source: sourceFromUrl,
        campaign: campaignFromUrl,
      });
      setFirstTouchShareSource(merged.firstTouchSource ?? "");
      setFirstTouchShareCampaign(merged.firstTouchCampaign ?? "");
      setLastTouchShareSource(merged.lastTouchSource ?? "");
      setLastTouchShareCampaign(merged.lastTouchCampaign ?? "");
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(merged),
      );
      return;
    }

    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = normalizeStoredShareAttribution(JSON.parse(saved));
      setFirstTouchShareSource(parsed.firstTouchSource ?? "");
      setFirstTouchShareCampaign(parsed.firstTouchCampaign ?? "");
      setLastTouchShareSource(parsed.lastTouchSource ?? "");
      setLastTouchShareCampaign(parsed.lastTouchCampaign ?? "");
    } catch {
      return;
    }
  }, [listingId, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/listings/${listingId}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        requestMessage,
        attestedHunterFee,
        attestedFishingRules,
        firstTouchShareSource: firstTouchShareSource || undefined,
        firstTouchShareCampaign: firstTouchShareCampaign || undefined,
        lastTouchShareSource: lastTouchShareSource || undefined,
        lastTouchShareCampaign: lastTouchShareCampaign || undefined,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to send the booking request.");
      return;
    }

    setSuccess(data.message ?? "Booking request sent to the landowner.");
    setStartDate("");
    setEndDate("");
    setRequestMessage("");
    setAttestedHunterFee(false);
    setAttestedFishingRules(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
          {listingType === ListingType.FISHING && instantBookEnabled ? "Instant checkout" : "Booking request"}
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          {listingType === ListingType.FISHING && instantBookEnabled
            ? "Choose the dates, confirm the rules, and start the contract and payment flow."
            : "Send the landowner a clear request with dates and a short introduction."}
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Your email must be verified first.
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          Cancellation policy: {formatCancellationPolicy(cancellationPolicy)}
        </p>
        {lastTouchShareSource ? (
          <div className="mt-4 rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-sm leading-7 text-[#29543a]">
            You arrived through a shared listing link
            {lastTouchShareCampaign ? ` (${lastTouchShareCampaign})` : ""}. If you book, the landowner will be able to see that this request came from their own promotion.
          </div>
        ) : null}
        {coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED ? (
          <div className="mt-4 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
            {valdName
              ? `This offer is connected to ${valdName}.`
              : "This offer may require shared approval."}{" "}
            {representativeConfirmationStatus === SharedApprovalStatus.NOT_REQUESTED
              ? "The representative has not been confirmed yet, so dates, quota, or permit allocation may still be very provisional."
              : representativeConfirmationStatus === SharedApprovalStatus.PENDING
                ? "The representative confirmation is still pending, so dates, quota, or permit allocation may take a little longer to lock in."
                : "Representative confirmation is marked as complete, but quota and local coordination should still be read carefully."}
          </div>
        ) : null}
        {quotaSummary || availabilitySummary || permitNotes || governanceNotes || reportingNotes || reportingResponsibility ? (
          <div className="mt-4 grid gap-3">
            {quotaSummary ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">Quota summary</p>
                <p className="mt-1 text-[var(--muted)]">{quotaSummary}</p>
              </div>
            ) : null}
            {availabilitySummary ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">What is likely still available</p>
                <p className="mt-1 text-[var(--muted)]">{availabilitySummary}</p>
              </div>
            ) : null}
            {permitNotes || governanceNotes ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">What still needs confirmation</p>
                <p className="mt-1 text-[var(--muted)]">
                  {[permitNotes, governanceNotes].filter(Boolean).join(" ")}
                </p>
              </div>
            ) : null}
            {reportingNotes ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">Reporting expectations</p>
                <p className="mt-1 text-[var(--muted)]">{reportingNotes}</p>
              </div>
            ) : null}
            {reportingResponsibility ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">Who reports after the trip</p>
                <p className="mt-1 text-[var(--muted)]">{reportingResponsibility}</p>
              </div>
            ) : null}
            {speciesRestrictions || gearRules || bagLimitNotes || areaNotes ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="font-semibold">Rules and area limits</p>
                <div className="mt-1 space-y-1 text-[var(--muted)]">
                  {speciesRestrictions ? <p>{speciesRestrictions}</p> : null}
                  {gearRules ? <p>{gearRules}</p> : null}
                  {bagLimitNotes ? <p>{bagLimitNotes}</p> : null}
                  {areaNotes ? <p>{areaNotes}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Message to landowner
        <textarea
          value={requestMessage}
          onChange={(event) => setRequestMessage(event.target.value)}
          rows={5}
          className="w-full rounded-[1.3rem] border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
          placeholder="Introduce yourself, your group, and what kind of hunt or trip you are planning."
        />
      </label>

      <div className="space-y-3 rounded-[1.3rem] border border-[var(--border)] bg-[#fbf8f1] p-4 text-sm leading-7 text-[var(--foreground)]">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={attestedHunterFee}
            onChange={(event) => setAttestedHunterFee(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--border)]"
          />
          <span>
            {listingType === ListingType.HUNTING
              ? "I confirm that my hunter fee is valid and that I can document it if asked."
              : requiresNationalFishingLicense
                ? "I confirm that I hold or will obtain the required national fishing fee before arrival."
                : "I understand that I am responsible for any required central permits or fees."}
          </span>
        </label>
        {listingType === ListingType.FISHING ? (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={attestedFishingRules}
              onChange={(event) => setAttestedFishingRules(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <span>I have read the fishing rules, restrictions, and valid-area notes for this offer.</span>
          </label>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSubmitting
          ? "Sending..."
          : listingType === ListingType.FISHING && instantBookEnabled
            ? "Start instant checkout"
            : "Send booking request"}
      </button>
    </form>
  );
}
