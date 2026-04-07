"use client";

import { ListingGovernanceModel } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingStatusActions({
  bookingId,
  allowedActions,
  governanceModel,
  coApprovalRequired,
  valdName,
}: {
  bookingId: string;
  allowedActions: Array<"approve" | "confirm_shared" | "decline" | "cancel" | "complete">;
  governanceModel: ListingGovernanceModel;
  coApprovalRequired: boolean;
  valdName: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requiresSharedConfirmation =
    coApprovalRequired || governanceModel === ListingGovernanceModel.VALD_MANAGED;

  async function runAction(action: "approve" | "confirm_shared" | "decline" | "cancel" | "complete") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        responseMessage: message,
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to update booking status.");
      setIsWorking(false);
      return;
    }

    setMessage("");
    setIsWorking(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {allowedActions.length === 0 ? (
        <p className="text-sm leading-7 text-[var(--muted)]">
          No further action is needed on this booking right now.
        </p>
      ) : null}
      {requiresSharedConfirmation && allowedActions.includes("approve") ? (
        <p className="rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
          This request may still need {valdName ?? "shared hunting area"} confirmation. Use the response box to explain what remains before the trip is fully locked in.
        </p>
      ) : null}
      {allowedActions.includes("confirm_shared") ? (
        <p className="rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-sm leading-7 text-[#29543a]">
          Shared confirmation is the step where you confirm that vald or other shared governance checks are actually complete, and only then move the booking into contract handling.
        </p>
      ) : null}
      {allowedActions.length > 0 ? (
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder={
            requiresSharedConfirmation && allowedActions.includes("approve")
              ? "Example: Tentatively approved. Final dates and quota are confirmed after vald review."
              : allowedActions.includes("confirm_shared")
                ? "Example: Vald confirmation received. Contracts and payment can now begin."
              : "Optional response message"
          }
          className="w-full rounded-[1.1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none"
        />
      ) : null}
      <div className="flex flex-wrap gap-3">
        {allowedActions.includes("approve") ? (
          <button
            type="button"
            onClick={() => runAction("approve")}
            disabled={isWorking}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {requiresSharedConfirmation ? "Approve pending confirmation" : "Approve"}
          </button>
        ) : null}
        {allowedActions.includes("confirm_shared") ? (
          <button
            type="button"
            onClick={() => runAction("confirm_shared")}
            disabled={isWorking}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            Confirm shared approval
          </button>
        ) : null}
        {allowedActions.includes("decline") ? (
          <button
            type="button"
            onClick={() => runAction("decline")}
            disabled={isWorking}
            className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
          >
            Decline
          </button>
        ) : null}
        {allowedActions.includes("cancel") ? (
          <button
            type="button"
            onClick={() => runAction("cancel")}
            disabled={isWorking}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-70"
          >
            Cancel
          </button>
        ) : null}
        {allowedActions.includes("complete") ? (
          <button
            type="button"
            onClick={() => runAction("complete")}
            disabled={isWorking}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            Mark completed
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
    </div>
  );
}
