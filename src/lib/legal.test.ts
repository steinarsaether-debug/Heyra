import { describe, expect, it } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY, LEGAL_VERSION, defaultCookieConsent } from "./legal";

describe("legal defaults", () => {
  it("exposes a cookie consent storage key", () => {
    expect(COOKIE_CONSENT_STORAGE_KEY).toBe("heyra-cookie-consent");
  });

  it("uses the current legal version in default consent state", () => {
    expect(defaultCookieConsent.version).toBe(LEGAL_VERSION);
  });
});
