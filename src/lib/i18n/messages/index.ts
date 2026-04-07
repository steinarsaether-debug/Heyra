import nbMessages from "@/lib/i18n/messages/nb";
import { defaultLocale, type AppLocale } from "@/lib/i18n/config";

export type Messages = typeof nbMessages;

const messageRegistry: Record<AppLocale, Messages> = {
  nb: nbMessages,
  nn: nbMessages,
  en: nbMessages,
  sv: nbMessages,
  da: nbMessages,
  fi: nbMessages,
  de: nbMessages,
};

export function getMessages(locale: AppLocale): Messages {
  return messageRegistry[locale] ?? messageRegistry[defaultLocale];
}

