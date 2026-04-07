import Link from "next/link";
import { ReactNode } from "react";
import type { Session } from "next-auth";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { HeyraLogo } from "@/components/brand/heyra-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { TrustBadge } from "@/components/trust/trust-badge";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { UserRole } from "@prisma/client";
import { HostQualityBadge } from "@/lib/trust-summary";
import { localizePathname } from "@/lib/i18n/config";

export function AppShell({
  children,
  locale,
  messages,
  session,
  userTrust,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
  session: Session | null;
  userTrust?: {
    trustSummary: string;
    hostBadge: HostQualityBadge | null;
  } | null;
}) {
  const t = createTranslator(locale, messages);
  const primaryNav = [
    { href: localizePathname(locale, "/"), label: t("shell.nav.home") },
    { href: localizePathname(locale, "/listings"), label: t("shell.nav.listings") },
    { href: localizePathname(locale, "/services"), label: t("shell.nav.services") },
    { href: localizePathname(locale, "/dashboard"), label: t("shell.nav.dashboard") },
  ];

  const guestNav = [
    { href: localizePathname(locale, "/auth/login"), label: t("shell.guest.logIn") },
    { href: localizePathname(locale, "/auth/register"), label: t("shell.guest.createAccount") },
  ];

  const legalNav = [
    { href: localizePathname(locale, "/legal/privacy"), label: t("common.legal.privacy") },
    { href: localizePathname(locale, "/legal/terms"), label: t("common.legal.terms") },
  ];

  const authenticatedNav = session?.user
    ? [
        { href: localizePathname(locale, "/dashboard/profile"), label: t("shell.nav.profile") },
        { href: localizePathname(locale, "/dashboard/notifications"), label: t("shell.nav.alerts") },
        { href: localizePathname(locale, "/dashboard/compliance"), label: t("shell.nav.compliance") },
        { href: localizePathname(locale, "/dashboard/settings/legal"), label: t("shell.nav.legal") },
        { href: localizePathname(locale, "/dashboard/bookings"), label: t("shell.nav.bookings") },
        { href: localizePathname(locale, "/dashboard/services"), label: t("shell.nav.services") },
        ...(session.user.role === UserRole.LANDOWNER
          ? [
              { href: localizePathname(locale, "/dashboard/properties"), label: t("shell.nav.myProperties") },
              { href: localizePathname(locale, "/dashboard/marketing"), label: t("shell.nav.marketing") },
              { href: localizePathname(locale, "/dashboard/properties/new"), label: t("shell.nav.addProperty") },
              { href: localizePathname(locale, "/dashboard/payouts"), label: t("shell.nav.payouts") },
            ]
          : []),
        ...(session.user.role === UserRole.ADMIN
          ? [
              { href: localizePathname(locale, "/dashboard/admin/reviews"), label: t("shell.nav.reviewQueue") },
              { href: localizePathname(locale, "/dashboard/admin/compliance"), label: t("shell.nav.complianceQueue") },
            ]
          : []),
      ]
    : [];
  const mobileNav = session?.user
    ? [
        { href: localizePathname(locale, "/"), label: t("shell.nav.home") },
        { href: localizePathname(locale, "/listings"), label: t("common.actions.search") },
        { href: localizePathname(locale, "/dashboard/bookings"), label: t("shell.nav.trips") },
        { href: localizePathname(locale, "/dashboard/services"), label: t("shell.nav.services") },
        {
          href:
            session.user.role === UserRole.LANDOWNER
              ? localizePathname(locale, "/dashboard/properties")
              : localizePathname(locale, "/dashboard"),
          label: session.user.role === UserRole.LANDOWNER ? t("shell.nav.land") : t("shell.nav.account"),
        },
      ]
    : [
        { href: localizePathname(locale, "/"), label: t("shell.nav.home") },
        { href: localizePathname(locale, "/listings"), label: t("common.actions.search") },
        { href: localizePathname(locale, "/services"), label: t("shell.nav.services") },
        { href: localizePathname(locale, "/auth/login"), label: t("shell.guest.logIn") },
      ];

  return (
    <div className="min-h-screen px-3 py-4 sm:px-8 lg:px-12">
      <div className="heyra-shell mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col rounded-[1.6rem] border border-[var(--border)] shadow-[0_20px_70px_rgba(16,42,33,0.12)] backdrop-blur sm:rounded-[2rem]">
        <header className="border-b border-[var(--border)] px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href={localizePathname(locale, "/")} className="inline-flex items-center gap-3">
                <span className="flex h-12 items-center">
                  <HeyraLogo className="h-11 w-auto" theme="dark" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--orange)]">
                    {t("shell.eyebrow")}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {t("shell.tagline")}
                  </p>
                </div>
              </Link>
            </div>

            <nav className="hidden flex-wrap items-center gap-2 md:flex">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="heyra-pill rounded-full px-4 py-2 text-sm font-medium transition hover:border-[rgba(16,42,33,0.18)] hover:bg-[rgba(255,255,255,0.94)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden flex-wrap items-center gap-2 lg:justify-end md:flex">
              {legalNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="heyra-pill rounded-full px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.94)] hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}

              <LanguageSwitcher currentLocale={locale} />

              {session?.user ? (
                <>
                  {authenticatedNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="heyra-pill rounded-full px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.94)] hover:text-[var(--foreground)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="heyra-pill rounded-full px-4 py-2 text-sm text-[var(--foreground)]">
                    {session.user.fullName} · {session.user.role.toLowerCase()}
                  </div>
                  {userTrust ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="heyra-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {userTrust.trustSummary}
                      </span>
                      {userTrust.hostBadge ? <TrustBadge compact {...userTrust.hostBadge} /> : null}
                    </div>
                  ) : null}
                  <SignOutButton />
                </>
              ) : (
                guestNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="heyra-pill rounded-full px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.94)] hover:text-[var(--foreground)]"
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 pb-24 md:pb-0">{children}</div>
      </div>
      <AppMobileNav items={mobileNav} />
    </div>
  );
}
