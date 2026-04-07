"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { OfflineStatus } from "@/components/pwa/offline-status";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <SessionProvider>
        {children}
        <ServiceWorkerRegistrar />
        <WebVitalsReporter />
        <OfflineStatus />
        <InstallPrompt />
        <CookieConsentBanner />
      </SessionProvider>
    </LocaleProvider>
  );
}
