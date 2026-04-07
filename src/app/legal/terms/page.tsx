import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { createTranslator } from "@/lib/i18n/translate";

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const paragraphs = messages.legalPages.terms.paragraphs as readonly string[];

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--amber)]">
          {t("legalPages.terms.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl text-[var(--forest)] sm:text-5xl">{t("legalPages.terms.title")}</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-[var(--foreground)]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
