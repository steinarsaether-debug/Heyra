import type { AppLocale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";

function getNestedValue(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

export function createTranslator(locale: AppLocale, messages: Messages) {
  return function translate(key: string, values?: Record<string, string | number>) {
    const raw = getNestedValue(messages, key);

    if (typeof raw !== "string") {
      return key;
    }

    if (!values) {
      return raw;
    }

    return Object.entries(values).reduce(
      (message, [token, value]) => message.replaceAll(`{${token}}`, String(value)),
      raw,
    );
  };
}

