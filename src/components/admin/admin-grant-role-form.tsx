"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminGrantRoleForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Skriv inn e-postadressen til en eksisterende bruker.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/users/grant-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });
      const data = (await response.json()) as { error?: string; user?: { email: string } };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke gi rolle til brukeren.");
      }

      setMessage(`Rolle oppdatert for ${data.user?.email ?? email.trim()}.`);
      setEmail("");
      setRole(UserRole.ADMIN);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke gi rolle.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Gi rolle til eksisterende bruker
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Dette oppretter ikke nye vanlige brukere. Det legger bare til en rolle på en konto som allerede finnes.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="bruker@eksempel.no"
          className="rounded-[1rem] border border-[rgba(16,42,33,0.12)] bg-white/90 px-4 py-3 text-[var(--foreground)] outline-none"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="rounded-[1rem] border border-[rgba(16,42,33,0.12)] bg-white/90 px-4 py-3 text-[var(--foreground)] outline-none"
        >
          <option value={UserRole.ADMIN}>Administrator</option>
          <option value={UserRole.LANDOWNER}>Grunneier</option>
          <option value={UserRole.HUNTER}>Jeger / fisker</option>
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-[1rem] bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {isSaving ? "Lagrer..." : "Gi rolle"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </section>
  );
}
