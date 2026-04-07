"use client";

import Link from "next/link";
import { useState } from "react";

export function EmailVerificationCard({
  email,
  isVerified,
}: {
  email: string;
  isVerified: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateLink() {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setVerifyUrl(null);

    const response = await fetch("/api/auth/email-verification/request", {
      method: "POST",
    });
    const data = (await response.json()) as {
      error?: string;
      alreadyVerified?: boolean;
      verifyUrl?: string;
    };

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Kunne ikke opprette verifiseringslenke.");
      return;
    }

    if (data.alreadyVerified) {
      setSuccess("Denne e-postadressen er allerede verifisert.");
      return;
    }

    setSuccess("Verifiseringslenken er klar.");
    setVerifyUrl(data.verifyUrl ?? null);
  }

  return (
    <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        E-postverifisering
      </p>
      <p className="mt-3 text-lg text-[var(--forest)]">{email}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
        {isVerified
          ? "E-postadressen din er verifisert."
          : "Verifiser e-posten før du publiserer annonser eller sender bestillingsforespørsler."}
      </p>

      {!isVerified ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleCreateLink}
            disabled={isSubmitting}
            className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Forbereder..." : "Opprett verifiseringslenke"}
          </button>
          {verifyUrl ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
              Lokal verifiseringslenke:{" "}
              <Link href={verifyUrl} className="font-semibold text-[var(--forest)]">
                {verifyUrl}
              </Link>
            </p>
          ) : null}
          {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
          {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
