"use client";

import { UserRole } from "@prisma/client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: UserRole.LANDOWNER, label: "Landowner" },
  { value: UserRole.HUNTER, label: "Hunter / Fisher" },
];

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
      role: String(formData.get("role") || ""),
      acceptTerms: formData.get("acceptTerms") === "on",
      acceptPrivacy: formData.get("acceptPrivacy") === "on",
      acceptMarketing: formData.get("acceptMarketing") === "on",
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setError(data.error || "We could not create your account.");
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsSubmitting(false);

    if (!signInResult || signInResult.error) {
      setError("Account created, but automatic sign-in failed. Please log in manually.");
      router.push("/auth/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="role">
          Starting role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={UserRole.HUNTER}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--amber)]"
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-4">
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
          <input name="acceptTerms" type="checkbox" className="mt-1" required />
          <span>
            I accept the{" "}
            <Link href="/legal/terms" className="font-semibold text-[var(--forest)]">
              Terms of Service
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
          <input name="acceptPrivacy" type="checkbox" className="mt-1" required />
          <span>
            I accept the{" "}
            <Link href="/legal/privacy" className="font-semibold text-[var(--forest)]">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
          <input name="acceptMarketing" type="checkbox" className="mt-1" />
          <span>
            I am happy to receive optional product updates and launch emails from Heyra.
          </span>
        </label>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[#fff1eb] px-4 py-3 text-sm text-[#8c3b19]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:bg-[var(--forest-soft)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link href="/auth/login" className="font-semibold text-[var(--forest)]">
          Sign in instead
        </Link>
        .
      </p>
    </form>
  );
}
