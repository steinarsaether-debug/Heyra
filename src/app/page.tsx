import type { Metadata } from "next";
import Link from "next/link";
import { HeyraLogo } from "@/components/brand/heyra-logo";
import { localizePathname } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { createTranslator } from "@/lib/i18n/translate";
import { absoluteUrl, getSiteDescription } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);

  return {
    title: t("home.metadataTitle"),
    description: getSiteDescription(messages),
    alternates: {
      canonical: absoluteUrl("/"),
    },
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const routeCards = [
    {
      href: localizePathname(locale, "/listings"),
      title: t("home.cards.listings.title"),
      body: t("home.cards.listings.body"),
    },
    {
      href: localizePathname(locale, "/dashboard"),
      title: t("home.cards.dashboard.title"),
      body: t("home.cards.dashboard.body"),
    },
    {
      href: localizePathname(locale, "/services"),
      title: t("home.cards.services.title"),
      body: t("home.cards.services.body"),
    },
    {
      href: localizePathname(locale, "/beta"),
      title: t("home.cards.beta.title"),
      body: t("home.cards.beta.body"),
    },
  ];

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="heyra-hero overflow-hidden rounded-[1.9rem] text-[var(--foreground)]">
          <div className="border-b border-[rgba(16,42,33,0.08)] px-8 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--forest-soft)]">
              {t("home.eyebrow")}
            </p>
          </div>

          <div className="space-y-8 px-8 py-10">
            <div className="max-w-3xl space-y-5">
              <div className="max-w-[18rem]">
                <HeyraLogo className="h-auto w-full" theme="dark" />
              </div>
              <h1 className="text-5xl leading-tight text-[var(--foreground-strong)] sm:text-6xl">
                {t("home.title")}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[rgba(16,42,33,0.74)]">
                {t("home.body")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={localizePathname(locale, "/listings")}
                className="heyra-accent-button rounded-full px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px]"
              >
                {t("common.actions.exploreListings")}
              </Link>
              <Link
                href={localizePathname(locale, "/services")}
                className="heyra-secondary-button rounded-full px-5 py-3 text-sm font-semibold transition hover:bg-[rgba(255,255,255,0.96)]"
              >
                {t("common.actions.browseServices")}
              </Link>
              <Link
                href={localizePathname(locale, "/auth/register")}
                className="heyra-secondary-button rounded-full px-5 py-3 text-sm font-semibold transition hover:bg-[rgba(255,255,255,0.96)]"
              >
                {t("common.actions.createAccount")}
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {(messages.home.highlights as readonly string[]).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,252,246,0.72)] px-4 py-4 text-sm leading-7 text-[rgba(16,42,33,0.76)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {routeCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card-strong)] p-6 transition hover:-translate-y-0.5 hover:border-[rgba(16,42,33,0.18)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--orange)]">
                {t("home.cardsEyebrow")}
              </p>
              <h2 className="mt-3 text-2xl text-[var(--foreground)]">{card.title}</h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                {card.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
