"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { HeyraLogo } from "@/components/brand/heyra-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import type { AppLocale } from "@/lib/i18n/config";
import { localizePathname, stripLocalePrefix } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";

export function AdminShell({
  children,
  locale,
  messages,
  session,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
  session: Session | null;
}) {
  const pathname = usePathname();
  const normalizedPathname = stripLocalePrefix(pathname).pathname;
  const t = createTranslator(locale, messages);

  const navItems = [
    {
      href: localizePathname(locale, "/admin/reviews"),
      label: t("shell.nav.reviewQueue"),
      active:
        normalizedPathname === "/admin" ||
        normalizedPathname === "/admin/reviews",
    },
    {
      href: localizePathname(locale, "/admin/compliance"),
      label: t("shell.nav.complianceQueue"),
      active: normalizedPathname.startsWith("/admin/compliance"),
    },
    {
      href: localizePathname(locale, "/admin/users"),
      label: t("shell.nav.users"),
      active: normalizedPathname.startsWith("/admin/users"),
    },
  ];

  const breadcrumb =
    normalizedPathname.startsWith("/admin/compliance")
      ? t("shell.nav.complianceQueue")
      : normalizedPathname.startsWith("/admin/users")
        ? t("shell.nav.users")
      : t("shell.nav.reviewQueue");

  return (
    <div className="min-h-screen bg-[#f5f2ea] px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-[92rem] overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[#fbf9f3] shadow-[0_26px_90px_rgba(16,42,33,0.12)]">
        <header className="border-b border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.95)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href={localizePathname(locale, "/")} className="inline-flex items-center gap-3">
                <div className="rounded-[1.3rem] border border-[rgba(16,42,33,0.08)] bg-white/92 px-5 py-3 shadow-[0_16px_30px_rgba(16,42,33,0.06)]">
                  <HeyraLogo className="h-7 w-auto sm:h-8" theme="dark" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--orange)]">
                    {t("shell.nav.adminPanel")}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {session?.user?.fullName ?? "Admin"}
                  </p>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-4 py-2 text-sm font-medium shadow-[0_10px_24px_rgba(16,42,33,0.05)] transition ${
                    item.active
                      ? "border-[rgba(16,42,33,0.18)] bg-[var(--forest)] text-white"
                      : "border-[rgba(16,42,33,0.1)] bg-white text-[var(--muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={localizePathname(locale, "/dashboard")}
                className="rounded-full border border-[rgba(16,42,33,0.1)] bg-white px-4 py-2 text-sm text-[var(--muted)] shadow-[0_10px_24px_rgba(16,42,33,0.05)] transition hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
              >
                {t("shell.nav.backToApp")}
              </Link>
              <LanguageSwitcher currentLocale={locale} />
              <SignOutButton />
            </nav>
          </div>
          <div className="mt-4 rounded-[1.3rem] border border-[rgba(16,42,33,0.08)] bg-white/88 px-4 py-3 text-sm text-[var(--muted)] shadow-[0_12px_26px_rgba(16,42,33,0.04)]">
            <span className="font-semibold text-[var(--foreground)]">{t("shell.nav.adminPanel")}</span>
            <span className="mx-2 text-[var(--border-strong)]">/</span>
            <span>{breadcrumb}</span>
          </div>
        </header>

        <div className="bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(247,242,233,0.92))] px-1 py-1">
          {children}
        </div>
      </div>
    </div>
  );
}
