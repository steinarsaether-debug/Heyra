export const supportedLocales = ["nb", "nn", "en", "sv", "da", "fi", "de"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "nb";

export const localeCookieName = "HEYRA_LOCALE";
export const localeHeaderName = "x-heyra-locale";

export const localeLabels: Record<AppLocale, string> = {
  nb: "Bokmal",
  nn: "Nynorsk",
  en: "English",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  de: "Deutsch",
};

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && supportedLocales.includes(value as AppLocale));
}

export function getLocalePrefix(locale: AppLocale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function localizePathname(locale: AppLocale, pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getLocalePrefix(locale)}${normalizedPath === "/" ? "" : normalizedPath}` || "/";
}

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (!isSupportedLocale(maybeLocale)) {
    return {
      locale: null,
      pathname,
    };
  }

  const rest = `/${segments.slice(2).join("/")}`.replace(/\/+/g, "/");

  return {
    locale: maybeLocale,
    pathname: rest === "/" ? "/" : rest.replace(/\/$/, "") || "/",
  };
}

