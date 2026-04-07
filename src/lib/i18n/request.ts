import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  localeHeaderName,
  type AppLocale,
} from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get(localeHeaderName);

  if (isSupportedLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export async function getRequestMessages() {
  const locale = await getRequestLocale();

  return {
    locale,
    messages: getMessages(locale),
  };
}

