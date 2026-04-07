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
      setError(data.error ?? "Unable to start the password reset flow.");
      return;
    }

    setSuccess("If the account exists, a reset request is now ready.");
    setResetUrl(data.resetUrl ?? null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.7rem] border border-[var(--border)] bg-white/80 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
          Password reset
        </p>
        <h2 className="mt-3 text-3xl text-[var(--forest)]">Reset your password</h2>
        <p className="mt-3 text-base leading-8 text-[var(--muted)]">
          Enter your email to start the reset flow. Third-party email delivery is not wired yet, so development currently shows the reset link directly after the request succeeds.
        </p>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Email address
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
          Local reset link: <Link href={resetUrl} className="font-semibold text-[var(--forest)]">{resetUrl}</Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Preparing..." : "Start reset"}
        </button>
        <Link
          href="/auth/login"
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
