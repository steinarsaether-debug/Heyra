"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/password-reset/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
        confirmPassword,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to reset the password.");
      return;
    }

    setSuccess("Password updated. You can now sign in with the new password.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.7rem] border border-[var(--border)] bg-white/80 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
          Set a new password
        </p>
        <h2 className="mt-3 text-3xl text-[var(--forest)]">Choose a new password</h2>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Reset token
        <input
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        />
      </label>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        New password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        />
      </label>

      <label className="block space-y-2 text-sm font-semibold text-[var(--foreground)]">
        Confirm password
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal outline-none"
        />
      </label>

      {error ? <p className="text-sm text-[#7f3127]">{error}</p> : null}
      {success ? <p className="text-sm text-[#1f5c3d]">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Update password"}
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
