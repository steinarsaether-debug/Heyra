"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";
import { RoleModeSwitcher } from "@/components/account/role-mode-switcher";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { formatUserRole } from "@/lib/user-status";
import { getUserRoles } from "@/lib/access";
import type { AppLocale } from "@/lib/i18n/config";
import { localizePathname, stripLocalePrefix } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { formatUserStatus } from "@/lib/user-status";
import { HeyraLogo } from "@/components/brand/heyra-logo";

type MenuLink = {
  href: string;
  label: string;
};

type MenuSection = {
  title: string;
  items: MenuLink[];
};

function MoreMenu({
  sections,
  isSignedIn,
  label,
  roleMode,
}: {
  sections: MenuSection[];
  isSignedIn: boolean;
  label: string;
  roleMode?: {
    roles: UserRole[];
    activeRole: UserRole;
    title: string;
  } | null;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <details ref={detailsRef} className="relative">
      <summary className="list-none rounded-full border border-[rgba(16,42,33,0.1)] bg-[rgba(255,255,255,0.84)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_10px_24px_rgba(16,42,33,0.05)] transition hover:bg-white">
        {label}
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[21rem] rounded-[1.7rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.98)] p-4 shadow-[0_26px_54px_rgba(16,42,33,0.18)] backdrop-blur">
        <div className="space-y-4">
          {roleMode ? (
            <>
              <RoleModeSwitcher
                roles={roleMode.roles}
                activeRole={roleMode.activeRole}
                title={roleMode.title}
              />
              <div className="border-t border-[var(--border)]" />
            </>
          ) : null}
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <section key={section.title} className="space-y-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {section.title}
                </p>
                <div className="grid gap-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className="rounded-[1rem] border border-[rgba(16,42,33,0.08)] bg-white/84 px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          {isSignedIn ? (
            <div className="border-t border-[var(--border)] pt-4">
              <SignOutButton />
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function MobileMoreSheet({
  open,
  onClose,
  sections,
  title,
  subtitle,
  closeLabel,
  isSignedIn,
  roleMode,
}: {
  open: boolean;
  onClose: () => void;
  sections: MenuSection[];
  title: string;
  subtitle: string;
  closeLabel: string;
  isSignedIn: boolean;
  roleMode?: {
    roles: UserRole[];
    activeRole: UserRole;
    title: string;
  } | null;
}) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="fixed inset-0 z-40 bg-[#102a21]/18 md:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-3 bottom-24 z-50 max-h-[70vh] overflow-y-auto rounded-[1.9rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.98)] p-4 shadow-[0_28px_60px_rgba(16,42,33,0.2)] backdrop-blur md:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {title}
            </p>
            <p className="text-base font-semibold text-[var(--foreground)]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(16,42,33,0.1)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            {closeLabel}
          </button>
        </div>

        <div className="space-y-4">
          {roleMode ? (
            <>
              <RoleModeSwitcher
                roles={roleMode.roles}
                activeRole={roleMode.activeRole}
                title={roleMode.title}
              />
              <div className="border-t border-[var(--border)]" />
            </>
          ) : null}
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <section key={section.title} className="space-y-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {section.title}
                </p>
                <div className="grid gap-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="rounded-[1rem] border border-[rgba(16,42,33,0.08)] bg-white/84 px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          {isSignedIn ? (
            <div className="border-t border-[var(--border)] pt-4">
              <SignOutButton />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function AppShell({
  children,
  locale,
  messages,
  session,
  userTrust: _userTrust,
  activeRole,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
  session: Session | null;
  activeRole?: UserRole | null;
  userTrust?: {
    trustSummary: string;
    hostBadge: unknown | null;
  } | null;
}) {
  const pathname = usePathname();
  const normalizedPathname = stripLocalePrefix(pathname).pathname;
  const isAdminExperience = normalizedPathname.startsWith("/admin");
  const t = createTranslator(locale, messages);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [pathname]);

  const isSignedIn = Boolean(session?.user);
  const userRoles = getUserRoles(session?.user);
  const currentActiveRole = activeRole && userRoles.includes(activeRole) ? activeRole : userRoles[0] ?? null;
  const isLandowner = userRoles.includes(UserRole.LANDOWNER);
  const isAdmin = userRoles.includes(UserRole.ADMIN);
  const roleMode =
    isSignedIn && userRoles.length > 1 && currentActiveRole
      ? {
          roles: userRoles,
          activeRole: currentActiveRole,
          title: locale === "en" ? "Active mode" : "Aktiv modus",
        }
      : null;

  const primaryNav = [
    {
      key: "explore",
      href: localizePathname(locale, "/listings"),
      label: t("shell.nav.explore"),
      active:
        normalizedPathname === "/" ||
        normalizedPathname.startsWith("/listings"),
    },
    {
      key: "trips",
      href: isSignedIn ? localizePathname(locale, "/dashboard/bookings") : localizePathname(locale, "/auth/login"),
      label: t("shell.nav.trips"),
      active:
        normalizedPathname.startsWith("/dashboard/bookings") ||
        normalizedPathname.startsWith("/dashboard/compliance"),
    },
    {
      key: "services",
      href: localizePathname(locale, "/services"),
      label: t("shell.nav.services"),
      active:
        normalizedPathname.startsWith("/services") ||
        normalizedPathname.startsWith("/dashboard/services"),
    },
  ];

  const moreSections = useMemo<MenuSection[]>(() => {
    const sections: MenuSection[] = [
      {
        title: t("shell.sections.discover"),
        items: [
          { href: localizePathname(locale, "/"), label: t("shell.nav.home") },
          { href: localizePathname(locale, "/listings"), label: t("shell.nav.listings") },
          {
            href: localizePathname(locale, "/listings/fishing/nearby"),
            label: t("shell.nav.nearbyFishing"),
          },
        ],
      },
      {
        title: t("shell.sections.account"),
        items: isSignedIn
          ? [
              { href: localizePathname(locale, "/dashboard"), label: t("shell.nav.dashboard") },
              { href: localizePathname(locale, "/dashboard/settings/account"), label: t("shell.nav.account") },
              { href: localizePathname(locale, "/dashboard/profile"), label: t("shell.nav.profile") },
              {
                href: localizePathname(locale, "/dashboard/notifications"),
                label: t("shell.nav.alerts"),
              },
            ]
          : [
              { href: localizePathname(locale, "/auth/login"), label: t("shell.guest.logIn") },
              {
                href: localizePathname(locale, "/auth/register"),
                label: t("shell.guest.createAccount"),
              },
            ],
      },
      {
        title: t("shell.sections.legal"),
        items: [
          { href: localizePathname(locale, "/legal/privacy"), label: t("common.legal.privacy") },
          { href: localizePathname(locale, "/legal/terms"), label: t("common.legal.terms") },
        ],
      },
    ];

    if (isLandowner) {
      sections.push({
        title: t("shell.sections.landowner"),
        items: [
          {
            href: localizePathname(locale, "/dashboard/properties"),
            label: t("shell.nav.myProperties"),
          },
          {
            href: localizePathname(locale, "/dashboard/properties/new"),
            label: t("shell.nav.addProperty"),
          },
          {
            href: localizePathname(locale, "/dashboard/marketing"),
            label: t("shell.nav.marketing"),
          },
          {
            href: localizePathname(locale, "/dashboard/payouts"),
            label: t("shell.nav.payouts"),
          },
        ],
      });
    }

    if (isSignedIn) {
      sections.push({
        title: t("shell.sections.provider"),
        items: [
          {
            href: localizePathname(locale, "/dashboard/services"),
            label: t("shell.nav.services"),
          },
          {
            href: localizePathname(locale, "/dashboard/services/insights"),
            label: `${t("shell.nav.services")} · ${t("shell.nav.dashboard")}`,
          },
        ],
      });
    }

    if (isAdmin) {
      sections.push({
        title: t("shell.sections.admin"),
        items: [
          {
            href: localizePathname(locale, "/admin"),
            label: t("shell.nav.adminPanel"),
          },
        ],
      });
    }

    return sections;
  }, [isAdmin, isLandowner, isSignedIn, locale, t]);

  const moreActive =
    !isAdminExperience &&
    !primaryNav.some((item) => item.active) &&
    normalizedPathname !== "/services";

  const mobileNav = [
    {
      href: primaryNav[0].href,
      label: primaryNav[0].label,
      active: primaryNav[0].active,
    },
    {
      href: primaryNav[1].href,
      label: primaryNav[1].label,
      active: primaryNav[1].active,
    },
    {
      href: primaryNav[2].href,
      label: primaryNav[2].label,
      active: primaryNav[2].active,
    },
    {
      label: t("shell.nav.more"),
      active: moreActive || mobileMoreOpen,
      onClick: () => setMobileMoreOpen(true),
    },
  ];

  if (isAdminExperience) {
    return (
      <AdminShell locale={locale} messages={messages} session={session}>
        {children}
      </AdminShell>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-5 lg:px-8">
      <div className="heyra-shell mx-auto flex min-h-[calc(100vh-2rem)] max-w-[92rem] flex-col overflow-hidden rounded-[1.8rem] border border-[rgba(16,42,33,0.1)] shadow-[0_26px_90px_rgba(16,42,33,0.12)] backdrop-blur sm:rounded-[2.2rem]">
        <header className="border-b border-[rgba(16,42,33,0.08)] bg-[rgba(255,251,245,0.95)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href={localizePathname(locale, "/")} className="inline-flex items-center gap-4">
                <div className="rounded-[1.4rem] border border-[rgba(16,42,33,0.08)] bg-white/92 px-5 py-3 shadow-[0_16px_30px_rgba(16,42,33,0.06)]">
                  <HeyraLogo className="h-8 w-auto sm:h-9" theme="dark" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--orange)]">
                    {t("shell.eyebrow")}
                  </p>
                  <p className="max-w-[8.5rem] text-sm leading-5 text-[var(--muted)]">
                    {t("shell.tagline")}
                  </p>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-2 lg:flex">
              {primaryNav.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-full border px-4 py-2 text-sm font-medium shadow-[0_10px_24px_rgba(16,42,33,0.05)] transition ${
                    item.active
                      ? "border-[rgba(16,42,33,0.18)] bg-[var(--forest)] text-white"
                      : "border-[rgba(16,42,33,0.1)] bg-[rgba(255,255,255,0.84)] text-[var(--foreground)] hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <MoreMenu sections={moreSections} isSignedIn={isSignedIn} label={t("shell.nav.more")} roleMode={roleMode} />
            </nav>

            <div className="hidden items-center gap-3 md:flex lg:justify-end">
              <LanguageSwitcher currentLocale={locale} />
              {session?.user ? (
                <>
                  {session.user.status && session.user.status !== "ACTIVE" ? (
                    <div className="rounded-full border border-[#d8c4a0] bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-[#6b5432] shadow-[0_10px_20px_rgba(16,42,33,0.04)]">
                      {formatUserStatus(session.user.status)}
                    </div>
                  ) : null}
                  <div className="rounded-full border border-[rgba(16,42,33,0.1)] bg-[#f7f4ed] px-4 py-2 text-sm text-[var(--foreground)] shadow-[0_10px_20px_rgba(16,42,33,0.04)]">
                    {session.user.fullName}
                  </div>
                  {currentActiveRole ? (
                    <div className="rounded-full border border-[rgba(16,42,33,0.1)] bg-white px-4 py-2 text-sm text-[var(--muted)] shadow-[0_10px_20px_rgba(16,42,33,0.04)]">
                      {locale === "en" ? "Mode" : "Modus"}: {formatUserRole(currentActiveRole)}
                    </div>
                  ) : null}
                  <SignOutButton className="rounded-full border border-[rgba(16,42,33,0.1)] bg-white px-4 py-2 text-sm text-[var(--foreground)] shadow-[0_10px_20px_rgba(16,42,33,0.04)] transition hover:bg-[var(--background-soft)]" />
                </>
              ) : (
                <Link
                  href={localizePathname(locale, "/auth/login")}
                  className="rounded-full border border-[rgba(16,42,33,0.1)] bg-white px-4 py-2 text-sm text-[var(--foreground)] shadow-[0_10px_20px_rgba(16,42,33,0.04)] transition hover:bg-[var(--background-soft)]"
                >
                  {t("shell.guest.logIn")}
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(247,242,233,0.92))] pb-24 md:pb-0">
          {children}
        </div>
      </div>
      <MobileMoreSheet
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        sections={moreSections}
        title={t("shell.nav.more")}
        subtitle={`${t("shell.nav.account")} · ${t("shell.nav.explore")}`}
        closeLabel={locale === "en" ? "Close" : "Lukk"}
        isSignedIn={isSignedIn}
        roleMode={roleMode}
      />
      <AppMobileNav items={mobileNav} />
    </div>
  );
}
