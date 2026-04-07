import enMessages from "@/lib/i18n/messages/en";
import nbMessages from "@/lib/i18n/messages/nb";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

type WidenStrings<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly WidenStrings<U>[]
    : T extends object
      ? { [K in keyof T]: WidenStrings<T[K]> }
      : T;

export type Messages = WidenStrings<typeof nbMessages>;

const messageRegistry: Record<AppLocale, Messages> = {
  nb: nbMessages,
  nn: nbMessages,
  en: enMessages,
  sv: nbMessages,
  da: nbMessages,
  fi: nbMessages,
  de: nbMessages,
};

export function getMessages(locale: AppLocale): Messages {
  return messageRegistry[locale] ?? messageRegistry[defaultLocale];
}
