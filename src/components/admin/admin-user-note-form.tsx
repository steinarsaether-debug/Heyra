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
    <div className="space-y-3 rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Intern merknad
      </p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        placeholder="Hva bør neste administrator vite om denne brukeren?"
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        className="rounded-xl bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white"
      >
        {isSaving ? "Lagrer..." : "Lagre intern merknad"}
      </button>
      {message ? <p className="text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </div>
  );
}
