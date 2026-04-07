import { ConsentType } from "@prisma/client";

export const LEGAL_VERSION = "2026-04-06";
export const COOKIE_CONSENT_STORAGE_KEY = "heyra-cookie-consent";

export type CookieConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
};

export const defaultCookieConsent: CookieConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: LEGAL_VERSION,
  updatedAt: new Date(0).toISOString(),
};

export function toConsentRecordType(key: "marketing") {
  const map = {
    marketing: ConsentType.MARKETING,
  } as const;

  return map[key];
}
