"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setResetUrl(null);

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json()) as {
      error?: string;
      resetUrl?: string;
    };

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke starte tilbakestilling av passord.");
      return;
    }

    setSuccess("Hvis kontoen finnes, er tilbakestillingen nå klar.");
    setResetUrl(data.resetUrl ?? null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.7rem] border border-[var(--border)] bg-white/80 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
          Tilbakestilling av passord
        </p>
        <h2 className="mt-3 text-3xl text-[var(--forest)]">Tilbakestill passordet ditt</h2>
        <p className="mt-3 text-base leading-8 text-[var(--muted)]">
          Skriv inn e-postadressen din for å starte tilbakestillingen. E-postutsending fra tredjepart er ikke koblet opp ennå, så utviklingsmiljøet viser lenken direkte etter at forespørselen lykkes.
        </p>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        E-postadresse
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        />
      </label>

      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}
      {resetUrl ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
          Lokal lenke for tilbakestilling: <Link href={resetUrl} className="font-semibold text-[var(--forest)]">{resetUrl}</Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Forbereder..." : "Start tilbakestilling"}
        </button>
        <Link
          href="/auth/login"
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
        >
          Tilbake til innlogging
        </Link>
      </div>
    </form>
  );
}
