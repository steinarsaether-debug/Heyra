"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="heyra-pill rounded-full px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.94)] hover:text-[var(--foreground)]"
    >
      Sign out
    </button>
  );
}
