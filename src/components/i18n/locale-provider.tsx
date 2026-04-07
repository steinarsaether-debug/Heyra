"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";

type LocaleContextValue = {
  locale: AppLocale;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  const value = useMemo(
    () => ({
      locale,
      messages,
    }),
    [locale, messages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }

  return context.locale;
}

export function useTranslations() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useTranslations must be used inside LocaleProvider.");
  }

  return useMemo(
    () => createTranslator(context.locale, context.messages),
    [context.locale, context.messages],
  );
}

