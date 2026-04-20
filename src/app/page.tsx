import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logoMark from "../../images/logo2.png";
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
  const isEnglish = locale === "en";

  const copy = {
    eyebrow: isEnglish ? "Trusted Norwegian access to hunting and fishing" : "Trygg tilgang til jakt, fiske og lokale verter",
    title: isEnglish
      ? "Find the next trip worth planning around."
      : "Finn turen det er verdt å rydde kalenderen for.",
    body: isEnglish
      ? "Heyra brings together hunting access, fishing water, and trusted local support in one calmer marketplace for people who want the trip to feel sorted before they arrive."
      : "Heyra samler jaktterreng, fiskemuligheter og lokal hjelp i en roligere markedsplass for folk som vil at turen skal føles avklart før de kommer frem.",
    searchOfferLabel: isEnglish ? "Category" : "Kategori",
    searchOfferAll: isEnglish ? "All" : "Alle",
    searchHunting: isEnglish ? "Hunting" : "Jakt",
    searchFishing: isEnglish ? "Fishing" : "Fiske",
    searchServices: isEnglish ? "Services" : "Tjenester",
    searchWhat: isEnglish ? "What are you looking for?" : "Hva vil du oppleve?",
    searchWhere: isEnglish ? "Search in valley, river, area or service" : "Søk i vald, vassdrag, område eller tjeneste",
    searchButton: isEnglish ? "Search experiences" : "Søk opplevelser",
    statHostsLabel: isEnglish ? "Host-ready profiles" : "Vertskapsklare profiler",
    statHostsValue: "20+",
    statRegionsLabel: isEnglish ? "Regions in the pipeline" : "Regioner i løypa",
    statRegionsValue: "8",
    statFlowsLabel: isEnglish ? "Flows for booking and compliance" : "Flyter for booking og etterlevelse",
    statFlowsValue: "1 sted",
    spotlightEyebrow: isEnglish ? "This week on Heyra" : "Denne uken pa Heyra",
    spotlightTitle: isEnglish ? "A homepage that feels more like a marketplace." : "En forside som oppleves mer som en markedsplass.",
    spotlightBody: isEnglish
      ? "Instead of stopping at navigation, we lead with seasons, places, and host quality so guests immediately understand what kind of trips Heyra is good at."
      : "I stedet for a stoppe ved navigasjon, leder vi med sesong, steder og vertskapskvalitet slik at gjester raskt forstar hva slags turer Heyra er god pa.",
    collectionsEyebrow: isEnglish ? "Featured collections" : "Utvalgte samlinger",
    collectionsTitle: isEnglish ? "Start with a reason to go." : "Start med en grunn til a dra.",
    collectionsBody: isEnglish
      ? "These are not just links deeper into the app. They should feel like invitations to specific kinds of field days, travel plans, and host-led experiences."
      : "Dette skal ikke bare vaere lenker dypere inn i appen. De skal oppleves som invitasjoner til konkrete feltdager, reiseplaner og vertskapsdrevne opplevelser.",
    planningEyebrow: isEnglish ? "Plan the full trip" : "Planlegg hele turen",
    planningTitle: isEnglish ? "From discovery to field day, keep the thread intact." : "Fra oppdagelse til feltdag, hold traden samlet.",
    planningBody: isEnglish
      ? "Heyra is strongest when the search, host trust, booking flow, legal checkpoints, and local services all feel like parts of the same trip."
      : "Heyra er sterkest nar sok, vertskapstillit, bookingflyt, juridiske sjekkpunkter og lokale tjenester oppleves som deler av samme tur.",
    providerEyebrow: isEnglish ? "For hosts" : "For vertskap",
    providerTitle: isEnglish ? "Your land deserves better presentation." : "Din jord fortjener en bedre presentasjon.",
    providerBody: isEnglish
      ? "Publish access with clearer boundaries, calmer booking flow, and a tone that feels premium enough for guests you actually want back."
      : "Publiser tilgang med tydeligere grenser, roligere bookingflyt og en tone som kjennes premium nok for gjestene du faktisk vil ha tilbake.",
    providerCta: isEnglish ? "Become a host" : "Bli vertskap",
    footerTagline: isEnglish ? "A calmer marketplace for hunting, fishing, and trusted local support." : "En roligere markedsplass for jakt, fiske og trygg lokal hjelp.",
    footerExplore: isEnglish ? "Explore" : "Utforsk",
    footerHosts: isEnglish ? "Hosts" : "Vertskap",
    footerSupport: isEnglish ? "Support" : "Hjelp",
    footerListings: isEnglish ? "Listings" : "Annonser",
    footerServices: isEnglish ? "Services" : "Tjenester",
    footerNearby: isEnglish ? "Fishing nearby" : "Fiske i naerheten",
    footerRegister: isEnglish ? "Register property" : "Registrer eiendom",
    footerPayouts: isEnglish ? "Payouts" : "Utbetalinger",
    footerCompliance: isEnglish ? "Compliance" : "Etterlevelse",
    footerBeta: isEnglish ? "Beta overview" : "Betaoversikt",
    footerCopyright: isEnglish ? "Outdoor access, host quality, and operational clarity." : "Tilgang til naturen, vertskapskvalitet og operativ klarhet.",
  };

  const collections = [
    {
      title: isEnglish ? "High-season hunting" : "Hoysesong for jakt",
      body: isEnglish
        ? "Hosted trips, mapped boundaries, and cleaner coordination for guests who want the practical side settled."
        : "Vertskapsdrevne turer, kartlagte grenser og enklere koordinering for gjester som vil ha den praktiske siden avklart.",
      href: localizePathname(locale, "/listings"),
      image:
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80",
      meta: isEnglish ? "Elk, deer, small game" : "Elg, hjort, smaavilt",
    },
    {
      title: isEnglish ? "Water you can plan around" : "Vann det er verdt a planlegge rundt",
      body: isEnglish
        ? "Fishing stays, rivers, and nearby options designed for both destination trips and spontaneous stops."
        : "Fiskeopphold, elver og naerfiske som fungerer for baade destinasjonsturer og spontane stopp.",
      href: `${localizePathname(locale, "/listings")}?offer=fishing`,
      image:
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1400&q=80",
      meta: isEnglish ? "Rivers, lakes, nearby search" : "Elver, vann, naersok",
    },
    {
      title: isEnglish ? "Trip support that matters" : "Tjenester som faktisk hjelper turen",
      body: isEnglish
        ? "Book the dog handler, accommodation, butcher, or transport around the trip instead of chasing it later."
        : "Bestill hundefoerer, overnatting, slakter eller transport rundt turen i stedet for a jage det senere.",
      href: localizePathname(locale, "/services"),
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
      meta: isEnglish ? "Dog handlers, stay, logistics" : "Hundefoerere, opphold, logistikk",
    },
  ];

  const spotlightCards = [
    {
      eyebrow: isEnglish ? "Why it feels premium" : "Hvorfor det kjennes premium",
      title: isEnglish ? "A clearer front door" : "En tydeligere inngang",
      body: isEnglish
        ? "The homepage should feel like editorial guidance into the market, not just a utilitarian header and search box."
        : "Forsiden skal oppleves som redaksjonell guiding inn i markedet, ikke bare som header og sokefelt.",
    },
    {
      eyebrow: isEnglish ? "What guests need" : "Hva gjestene trenger",
      title: isEnglish ? "Signals before details" : "Signaler for detaljer",
      body: isEnglish
        ? "Season, trip style, host confidence, and nearby support should be visible before someone commits to reading the fine print."
        : "Sesong, turtype, vertskapstillit og lokal hjelp bor vaere synlig for noen fordyper seg i detaljene.",
    },
    {
      eyebrow: isEnglish ? "What hosts need" : "Hva vertskapet trenger",
      title: isEnglish ? "A better stage for good land" : "En bedre scene for gode omrader",
      body: isEnglish
        ? "Landowners need a surface that presents quality, not one that makes every listing feel administratively flat."
        : "Grunneiere trenger en flate som viser kvalitet, ikke en som gjor hver annonse administrativt flat.",
    },
  ];

  const planningCards = [
    {
      title: isEnglish ? "Explore with confidence" : "Utforsk med trygghet",
      body: isEnglish
        ? "Search across listings with a calmer first pass, then go deeper into maps, boundaries, and trust signals."
        : "Sok pa tvers av annonser med en roligere ffirstepassasje, og ga deretter dypere inn i kart, grenser og tillitssignaler.",
      href: localizePathname(locale, "/listings"),
      cta: isEnglish ? "Browse listings" : "Se annonser",
    },
    {
      title: isEnglish ? "Book the surrounding help" : "Bestill hjelpen rundt turen",
      body: isEnglish
        ? "Service listings keep transport, accommodation, and practical support close to the trip instead of spread across messages."
        : "Tjenestene holder transport, overnatting og praktisk hjelp tett pa turen i stedet for spredt i meldinger.",
      href: localizePathname(locale, "/services"),
      cta: isEnglish ? "View services" : "Se tjenester",
    },
    {
      title: isEnglish ? "Keep the trip organized" : "Hold turen samlet",
      body: isEnglish
        ? "The dashboard ties together bookings, documents, compliance work, and host communication in one operating surface."
        : "Oversikten binder sammen bookinger, dokumenter, etterlevelse og vertskapsdialog i ett arbeidsomrade.",
      href: localizePathname(locale, "/dashboard"),
      cta: isEnglish ? "Open dashboard" : "Apne oversikt",
    },
  ];

  const footerGroups = [
    {
      title: copy.footerExplore,
      links: [
        { href: localizePathname(locale, "/listings"), label: copy.footerListings },
        { href: localizePathname(locale, "/services"), label: copy.footerServices },
        { href: localizePathname(locale, "/listings/fishing/nearby"), label: copy.footerNearby },
      ],
    },
    {
      title: copy.footerHosts,
      links: [
        { href: localizePathname(locale, "/auth/register"), label: copy.providerCta },
        { href: localizePathname(locale, "/dashboard/properties/new"), label: copy.footerRegister },
        { href: localizePathname(locale, "/dashboard/payouts"), label: copy.footerPayouts },
      ],
    },
    {
      title: copy.footerSupport,
      links: [
        { href: localizePathname(locale, "/dashboard/compliance"), label: copy.footerCompliance },
        { href: localizePathname(locale, "/beta"), label: copy.footerBeta },
        { href: localizePathname(locale, "/legal/privacy"), label: t("common.legal.privacy") },
      ],
    },
  ];

  return (
    <main className="px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.9)] shadow-[0_28px_90px_rgba(16,42,33,0.1)] backdrop-blur-sm">
        <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.15)] bg-[#112118] text-white">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(7,18,14,0.88) 0%, rgba(7,18,14,0.64) 42%, rgba(7,18,14,0.26) 100%), url(https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=80)",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
          <div className="relative">
            <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
              <Link href={localizePathname(locale, "/")} className="flex items-center gap-3">
                <div className="rounded-[1.4rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-5 py-3 backdrop-blur-sm">
                  <HeyraLogo className="h-8 w-auto sm:h-9" theme="light" />
                </div>
              </Link>
              <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
                <Link
                  href={localizePathname(locale, "/services")}
                  className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-white/88 transition hover:bg-[rgba(255,255,255,0.14)]"
                >
                  {copy.footerServices}
                </Link>
                <Link
                  href={localizePathname(locale, "/auth/login")}
                  className="rounded-full px-4 py-2 text-white/88 transition hover:bg-[rgba(255,255,255,0.1)]"
                >
                  {t("common.actions.logIn")}
                </Link>
                <Link
                  href={localizePathname(locale, "/auth/register")}
                  className="rounded-full bg-[var(--orange)] px-4 py-2 text-[#180d06] transition hover:brightness-95"
                >
                  {copy.providerCta}
                </Link>
              </nav>
            </header>

            <div className="grid gap-8 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.72fr)] lg:px-10 lg:pb-12 lg:pt-10">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/68">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  {copy.body}
                </p>

                <form
                  action={localizePathname(locale, "/listings")}
                  className="mt-8 rounded-[1.8rem] border border-[rgba(255,255,255,0.16)] bg-[rgba(255,248,240,0.95)] p-3 text-[var(--foreground)] shadow-[0_24px_60px_rgba(10,25,22,0.28)]"
                >
                  <div className="grid gap-3 lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.1fr)_auto]">
                    <label className="rounded-[1.2rem] bg-white/84 px-4 py-3">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {copy.searchOfferLabel}
                      </span>
                      <select
                        name="offer"
                        defaultValue=""
                        className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold text-[var(--foreground)] outline-none"
                      >
                        <option value="">{copy.searchOfferAll}</option>
                        <option value="hunting">{copy.searchHunting}</option>
                        <option value="fishing">{copy.searchFishing}</option>
                        <option value="services">{copy.searchServices}</option>
                      </select>
                    </label>

                    <label className="rounded-[1.2rem] bg-white/84 px-4 py-3">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {isEnglish ? "Trip or species" : "Tur eller art"}
                      </span>
                      <input
                        type="text"
                        name="q"
                        placeholder={copy.searchWhat}
                        className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-[var(--foreground)] outline-none"
                      />
                    </label>

                    <label className="rounded-[1.2rem] bg-white/84 px-4 py-3">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {isEnglish ? "Place" : "Sted"}
                      </span>
                      <input
                        type="text"
                        name="municipality"
                        placeholder={copy.searchWhere}
                        className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-[var(--foreground)] outline-none"
                      />
                    </label>

                    <button
                      type="submit"
                      className="inline-flex min-h-[4.25rem] items-center justify-center rounded-[1.2rem] bg-[var(--orange)] px-6 text-sm font-semibold text-[#1b0f07] transition hover:brightness-95"
                    >
                      {copy.searchButton}
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid gap-4 self-end">
                <div className="rounded-[1.7rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                    {copy.spotlightEyebrow}
                  </p>
                  <p className="mt-3 text-2xl font-semibold leading-tight text-white">
                    {copy.spotlightTitle}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    {copy.spotlightBody}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    { value: copy.statHostsValue, label: copy.statHostsLabel },
                    { value: copy.statRegionsValue, label: copy.statRegionsLabel },
                    { value: copy.statFlowsValue, label: copy.statFlowsLabel },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.5rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-5 py-4 backdrop-blur-sm"
                    >
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-white/68">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(249,244,236,0.92))] px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--orange)]">
                {copy.collectionsEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground-strong)] sm:text-4xl">
                {copy.collectionsTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--muted)]">
                {copy.collectionsBody}
              </p>
            </div>
            <Link
              href={localizePathname(locale, "/listings")}
              className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
            >
              {isEnglish ? "See all experiences" : "Se alle opplevelser"}
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.title}
                href={collection.href}
                className="group relative min-h-[25rem] overflow-hidden rounded-[1.8rem] bg-[#102019] text-white shadow-[0_20px_50px_rgba(16,42,33,0.12)]"
              >
                <div
                  className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(7,18,14,0.08) 0%, rgba(7,18,14,0.72) 72%, rgba(7,18,14,0.92) 100%), url(${collection.image})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
                <div className="relative flex h-full flex-col justify-end p-6">
                  <p className="inline-flex w-fit rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/78 backdrop-blur-sm">
                    {collection.meta}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
                    {collection.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/76">
                    {collection.body}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-white">
                    {isEnglish ? "Open collection" : "Apne samling"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--border)] bg-[#f4eee3] px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {spotlightCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_16px_35px_rgba(16,42,33,0.05)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--orange)]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground-strong)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--border)] bg-white px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--orange)]">
                {copy.planningEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground-strong)] sm:text-4xl">
                {copy.planningTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--muted)]">
                {copy.planningBody}
              </p>
            </div>
            <div className="grid gap-4">
              {planningCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(16,42,33,0.08)] bg-[linear-gradient(180deg,rgba(255,252,246,0.9),rgba(246,241,231,0.82))] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(16,42,33,0.08)] sm:flex-row sm:items-end sm:justify-between"
                >
                  <div className="max-w-xl">
                    <h3 className="text-xl font-semibold text-[var(--foreground-strong)]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {card.body}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--forest-soft)]">
                    {card.cta}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div
            className="overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.14)] text-white shadow-[0_24px_60px_rgba(16,42,33,0.12)]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(10,25,22,0.88) 0%, rgba(10,25,22,0.42) 56%, rgba(10,25,22,0.18) 100%), url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80)",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="max-w-xl px-6 py-10 sm:px-8 sm:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/68">
                {copy.providerEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                {copy.providerTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-white/78">
                {copy.providerBody}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={localizePathname(locale, "/auth/register")}
                  className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.94)]"
                >
                  {copy.providerCta}
                </Link>
                <Link
                  href={localizePathname(locale, "/dashboard/properties/new")}
                  className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  {isEnglish ? "Prepare a property" : "Klargjor eiendom"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--border)] bg-[#efe8db] px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="max-w-sm">
              <HeyraLogo className="h-8 w-auto" theme="dark" />
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {copy.footerTagline}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-sm font-semibold text-[var(--foreground-strong)]">
                    {group.title}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {group.links.map((item) => (
                      <Link key={item.label} href={item.href} className="block transition hover:text-[var(--foreground)]">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(16,42,33,0.08)] pt-5 text-xs text-[var(--muted)]">
            <p>© Heyra 2026. {copy.footerCopyright}</p>
            <div className="flex flex-wrap gap-4">
              <Link href={localizePathname(locale, "/legal/privacy")}>{t("common.legal.privacy")}</Link>
              <Link href={localizePathname(locale, "/legal/terms")}>{t("common.legal.terms")}</Link>
              <Link href={localizePathname(locale, "/dashboard/settings/legal")}>
                {isEnglish ? "Cookie choices" : "Kakevalg"}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
