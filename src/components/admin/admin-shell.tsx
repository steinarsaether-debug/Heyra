"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import type { AppLocale } from "@/lib/i18n/config";
import { localizePathname, stripLocalePrefix } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import logoMark from "../../../images/logo2.png";

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
  ];

  const breadcrumb =
    normalizedPathname.startsWith("/admin/compliance")
      ? t("shell.nav.complianceQueue")
      : t("shell.nav.reviewQueue");

  return (
    <div className="min-h-screen bg-[#f5f2ea] px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-7xl rounded-[1.8rem] border border-[var(--border)] bg-[#fbf9f3] shadow-[0_24px_70px_rgba(16,42,33,0.10)]">
        <header className="border-b border-[var(--border)] bg-[#f7f4ed] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href={localizePathname(locale, "/")} className="inline-flex items-center gap-3">
                <Image src={logoMark} alt="Heyra" className="h-12 w-auto" priority />
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
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    item.active
                      ? "border-[rgba(16,42,33,0.18)] bg-[var(--forest)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={localizePathname(locale, "/dashboard")}
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--background-soft)] hover:text-[var(--foreground)]"
              >
                {t("shell.nav.backToApp")}
              </Link>
              <LanguageSwitcher currentLocale={locale} />
              <SignOutButton />
            </nav>
          </div>
          <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">{t("shell.nav.adminPanel")}</span>
            <span className="mx-2 text-[var(--border-strong)]">/</span>
            <span>{breadcrumb}</span>
          </div>
        </header>

        <div className="px-1 py-1">{children}</div>
      </div>
    </div>
  );
}
