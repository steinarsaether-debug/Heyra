"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StatusValue = "ACTIVE" | "PENDING_REVIEW" | "SUSPENDED" | "DEACTIVATED";

export function AdminUserStatusActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: StatusValue;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusValue>(currentStatus);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reason,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke oppdatere brukerstatus.");
      }

      setMessage("Brukerstatus er oppdatert.");
      setReason("");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke oppdatere status.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Status og oppfølging
      </p>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as StatusValue)}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
      >
        <option value="ACTIVE">Aktiv</option>
        <option value="PENDING_REVIEW">Til gjennomgang</option>
        <option value="SUSPENDED">Suspendert</option>
        <option value="DEACTIVATED">Deaktivert</option>
      </select>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={4}
        placeholder="Kort begrunnelse eller intern merknad"
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        className="rounded-xl bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white"
      >
        {isSaving ? "Lagrer..." : "Oppdater status"}
      </button>
      {message ? <p className="text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </div>
  );
}
