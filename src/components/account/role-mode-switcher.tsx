"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUserRole } from "@/lib/user-status";

export function RoleModeSwitcher({
  roles,
  activeRole,
  title,
}: {
  roles: UserRole[];
  activeRole: UserRole;
  title: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextRole: UserRole) {
    if (nextRole === activeRole) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/active-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke bytte rollemodus.");
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke bytte modus.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        {title}
      </p>
      <div className="grid gap-2">
        {roles.map((role) => {
          const selected = role === activeRole;

          return (
            <button
              key={role}
              type="button"
              onClick={() => handleChange(role)}
              disabled={isSaving}
              className={`rounded-[1rem] border px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-[rgba(16,42,33,0.18)] bg-[var(--forest)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--background-soft)]"
              }`}
            >
              {formatUserRole(role)}
            </button>
          );
        })}
      </div>
      {error ? <p className="px-1 text-sm leading-6 text-[#8a3d2c]">{error}</p> : null}
    </section>
  );
}
