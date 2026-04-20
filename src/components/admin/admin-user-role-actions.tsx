"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const roleOptions = [
  { value: UserRole.HUNTER, label: "Jeger / fisker" },
  { value: UserRole.LANDOWNER, label: "Grunneier" },
  { value: UserRole.ADMIN, label: "Administrator" },
];

export function AdminUserRoleActions({
  userId,
  currentRoles,
}: {
  userId: string;
  currentRoles: UserRole[];
}) {
  const router = useRouter();
  const initialRoles = useMemo(
    () => (currentRoles.length > 0 ? currentRoles : [UserRole.HUNTER]),
    [currentRoles],
  );
  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: UserRole) {
    setRoles((current) => {
      if (current.includes(role)) {
        const next = current.filter((entry) => entry !== role);
        return next.length > 0 ? next : current;
      }

      return [...current, role];
    });
  }

  async function handleSubmit() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke oppdatere brukerroller.");
      }

      setMessage("Brukerroller er oppdatert.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke oppdatere roller.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.8rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,239,229,0.86))] p-6 shadow-[0_18px_44px_rgba(16,42,33,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        Roller og tilgang
      </p>
      <div className="grid gap-3">
        {roleOptions.map((role) => (
          <label
            key={role.value}
            className="flex items-start gap-3 rounded-[1.25rem] border border-[rgba(16,42,33,0.08)] bg-white/72 px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
          >
            <input
              type="checkbox"
              checked={roles.includes(role.value)}
              onChange={() => toggleRole(role.value)}
              className="mt-1"
            />
            <span>{role.label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSaving}
        className="rounded-[1rem] bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        {isSaving ? "Lagrer..." : "Oppdater roller"}
      </button>
      {message ? <p className="text-sm leading-7 text-[#29543a]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8a3d2c]">{error}</p> : null}
    </div>
  );
}
