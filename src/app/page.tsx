import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logoMark from "../../images/logo2.png";
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
  const categories = [
    {
      href: localizePathname(locale, "/listings"),
      title: "Elgjakt",
      image:
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=80",
    },
    {
      href: `${localizePathname(locale, "/listings")}?offer=fishing`,
      title: "Fluefiske",
      image:
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80",
    },
    {
      href: `${localizePathname(locale, "/listings")}?species=GROUSE`,
      title: "Rypejakt",
      image:
        "https://images.unsplash.com/photo-1501706362039-c6e80948bb5b?auto=format&fit=crop&w=900&q=80",
    },
    {
      href: localizePathname(locale, "/services"),
      title: "Andre naturopplevelser",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
  ];
  const footerGroups = [
    {
      title: "Om oss",
      links: [
        { href: localizePathname(locale, "/"), label: "Slik fungerer Heyra" },
        { href: localizePathname(locale, "/beta"), label: "Om oss" },
        { href: localizePathname(locale, "/legal/privacy"), label: "Kontakt" },
      ],
    },
    {
      title: "Vertskap",
      links: [
        { href: localizePathname(locale, "/auth/register"), label: "Lei ut ditt jord" },
        { href: localizePathname(locale, "/dashboard/properties/new"), label: "Ansvarlig vertskap" },
        { href: localizePathname(locale, "/dashboard/payouts"), label: "Utbetalinger" },
      ],
    },
    {
      title: "Hjelp",
      links: [
        { href: localizePathname(locale, "/dashboard/compliance"), label: "Hjelpesenter" },
        { href: localizePathname(locale, "/legal/terms"), label: "Kansellering" },
      ],
    },
  ];

  return (
    <main className="px-4 py-4 sm:px-6 md:px-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(16,42,33,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-3 sm:px-6">
          <Link href={localizePathname(locale, "/")} className="flex items-center gap-3">
            <Image src={logoMark} alt="Heyra" className="h-8 w-auto" priority />
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link
              href={localizePathname(locale, "/auth/register")}
              className="rounded-md bg-[#4f9e9b] px-3 py-2 text-white transition hover:brightness-95"
            >
              Bli vertskap
            </Link>
            <Link
              href={localizePathname(locale, "/auth/login")}
              className="rounded-md px-3 py-2 text-[var(--foreground)] transition hover:bg-[var(--background-soft)]"
            >
              Logg inn
            </Link>
          </div>
        </header>

        <section className="heyra-home-hero flex min-h-[28rem] items-start justify-center px-6 py-8 sm:px-10 sm:py-10">
          <div className="w-full max-w-3xl rounded-[1.8rem] bg-[rgba(255,255,255,0.2)] p-4 backdrop-blur-[2px] sm:p-6">
            <div className="rounded-[1.6rem] bg-[rgba(255,255,255,0.74)] px-5 py-5 shadow-[0_18px_50px_rgba(16,42,33,0.12)]">
              <h1 className="text-center text-2xl font-semibold text-[var(--foreground-strong)] sm:text-3xl">
                Søk og book din neste jakt- og fisketur her
              </h1>
              <form
                action={localizePathname(locale, "/listings")}
                className="mt-5 flex flex-col gap-3 rounded-full border border-[rgba(16,42,33,0.12)] bg-white p-2 shadow-[0_10px_30px_rgba(16,42,33,0.08)] sm:flex-row sm:items-center"
              >
                <select
                  name="offer"
                  defaultValue=""
                  className="rounded-full border border-transparent bg-transparent px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none sm:min-w-[7rem]"
                >
                  <option value="">Dyr</option>
                  <option value="hunting">Jakt</option>
                  <option value="fishing">Fiske</option>
                  <option value="services">Tjenester</option>
                </select>
                <input
                  type="text"
                  name="q"
                  placeholder="Hva vil du oppleve?"
                  className="min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                />
                <input
                  type="text"
                  name="municipality"
                  placeholder="Søk i Vald, vassdrag eller jakt / tjenester"
                  className="min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--orange)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Søk
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--foreground-strong)]">Friluftsliv</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-[1.3rem] transition hover:-translate-y-0.5"
                >
                  <div
                    className="h-32 rounded-[1.1rem] bg-cover bg-center shadow-[0_12px_30px_rgba(16,42,33,0.10)]"
                    style={{ backgroundImage: `url(${card.image})` }}
                  />
                  <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{card.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-8 sm:px-8">
          <div className="heyra-home-host-banner overflow-hidden rounded-[1.5rem] px-6 py-8 text-white sm:px-8">
            <div className="max-w-sm space-y-3">
              <p className="text-3xl font-semibold leading-tight">Din jord er verdt å dele</p>
              <p className="text-sm leading-7 text-white/88">
                Lei ut jakt- og fiskemuligheter med tryggere styring, tydeligere bookingflyt og lokal støtte.
              </p>
              <Link
                href={localizePathname(locale, "/auth/register")}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.92)]"
              >
                Bli vertskap
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--border)] bg-[#f1efec] px-6 py-8 sm:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title} className="space-y-3 text-sm">
                <p className="font-semibold text-[var(--foreground-strong)]">{group.title}</p>
                <div className="space-y-2 text-[var(--muted)]">
                  {group.links.map((item) => (
                    <Link key={item.label} href={item.href} className="block transition hover:text-[var(--foreground)]">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(16,42,33,0.08)] pt-5 text-xs text-[var(--muted)]">
            <p>© Heyra 2026</p>
            <div className="flex flex-wrap gap-4">
              <Link href={localizePathname(locale, "/legal/privacy")}>{t("common.legal.privacy")}</Link>
              <Link href={localizePathname(locale, "/legal/terms")}>{t("common.legal.terms")}</Link>
              <Link href={localizePathname(locale, "/dashboard/settings/legal")}>Kakevalg</Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
