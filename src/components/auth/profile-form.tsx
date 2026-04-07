"use client";

import { FormEvent, useState } from "react";

type ProfileFormProps = {
  initialValues: {
    fullName: string;
    address: string;
    phone: string;
    emergencyName: string;
    emergencyPhone: string;
    hunterNumber: string;
  };
  roleLabel: string;
};

export function ProfileForm({ initialValues, roleLabel }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      address: String(formData.get("address") || ""),
      phone: String(formData.get("phone") || ""),
      emergencyName: String(formData.get("emergencyName") || ""),
      emergencyPhone: String(formData.get("emergencyPhone") || ""),
      hunterNumber: String(formData.get("hunterNumber") || ""),
    };

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Vi kunne ikke oppdatere profilen din.");
      return;
    }

    setSuccess("Profilen er oppdatert.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[1.4rem] border border-[var(--border)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
        Nåværende rolle: <span className="font-semibold text-[var(--foreground)]">{roleLabel}</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="fullName">
            Fullt navn
          </label>
          <input
            id="fullName"
            name="fullName"
            defaultValue={initialValues.fullName}
            required
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="phone">
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={initialValues.phone}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="hunterNumber"
          >
            Jegernummer
          </label>
          <input
            id="hunterNumber"
            name="hunterNumber"
            defaultValue={initialValues.hunterNumber}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="address">
            Adresse
          </label>
          <textarea
            id="address"
            name="address"
            defaultValue={initialValues.address}
            rows={3}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="emergencyName"
          >
            Navn på nødkontakt
          </label>
          <input
            id="emergencyName"
            name="emergencyName"
            defaultValue={initialValues.emergencyName}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="emergencyPhone"
          >
            Telefon til nødkontakt
          </label>
          <input
            id="emergencyPhone"
            name="emergencyPhone"
            defaultValue={initialValues.emergencyPhone}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[#fff1eb] px-4 py-3 text-sm text-[#8c3b19]">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl bg-[#edf8ef] px-4 py-3 text-sm text-[#21542e]">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:bg-[var(--forest-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Lagrer..." : "Lagre profil"}
      </button>
    </form>
  );
}
