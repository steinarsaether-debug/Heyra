"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  defaultLocale,
  localeLabels,
  localizePathname,
  stripLocalePrefix,
  supportedLocales,
  type AppLocale,
} from "@/lib/i18n/config";
import { useTranslations } from "@/components/i18n/locale-provider";

export function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: AppLocale;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchLanguage(nextLocale: AppLocale) {
    const normalizedPath = stripLocalePrefix(pathname).pathname;
    const localizedPath = localizePathname(nextLocale, normalizedPath);
    const nextUrl = `${localizedPath}${searchParams.toString() ? `?${searchParams}` : ""}`;

    document.cookie = `HEYRA_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.assign(nextUrl);
  }

  return (
    <label className="heyra-pill inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm text-[var(--muted)]">
      <span className="hidden sm:inline">{t("common.language")}</span>
      <select
        aria-label="Velg språk"
        className="bg-transparent text-sm font-medium text-[var(--foreground)] outline-none"
        value={currentLocale}
        onChange={(event) => switchLanguage(event.target.value as AppLocale)}
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
            {locale === defaultLocale ? " (standard)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
