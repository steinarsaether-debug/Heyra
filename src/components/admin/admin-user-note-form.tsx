"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminUserNoteForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!body.trim()) {
      setError("Skriv en kort intern merknad først.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke lagre intern merknad.");
      }

      setBody("");
      setMessage("Intern merknad er lagret.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke lagre merknad.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Intern merknad
      </p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        placeholder="Hva bør neste administrator vite om denne brukeren?"
        className="w-full rounded-[1rem] border border-[rgba(16,42,33,0.12)] bg-white/90 px-4 py-3 text-[var(--foreground)] outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        className="rounded-[1rem] bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        {isSaving ? "Lagrer..." : "Lagre intern merknad"}
      </button>
      {message ? <p className="text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </div>
  );
}
