import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { createTranslator } from "@/lib/i18n/translate";

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const paragraphs = messages.legalPages.privacy.paragraphs as readonly string[];

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 md:px-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
        <div className="bg-[linear-gradient(135deg,rgba(10,25,22,0.92),rgba(10,25,22,0.72))] px-8 py-10 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/64">
          {t("legalPages.privacy.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl">{t("legalPages.privacy.title")}</h1>
        </div>
        <div className="space-y-6 px-8 py-8 text-base leading-8 text-[var(--foreground)]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
