import type { Messages } from "@/lib/i18n/messages";

export const SITE_NAME = "Heyra";

export function getSiteDescription(messages?: Messages) {
  return messages?.site.description ?? "Marketplace for hunting access, fishing licences, and trusted outdoor hosts in Norway.";
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString();
}
