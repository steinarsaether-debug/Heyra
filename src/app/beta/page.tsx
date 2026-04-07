import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Beta Launch",
  description: "Heyra beta launch preparation for landowners, reviewers, and press.",
  alternates: {
    canonical: absoluteUrl("/beta"),
  },
};

const betaSections = [
  {
    title: "Landowner beta",
    body: "Recruit the first 20 to 30 landowners across Innlandet, Trondelag, and Troms, with a mix of hunting and fishing offers.",
  },
  {
    title: "Launch operations",
    body: "Use the built-in listing, booking, trust, and marketing tools to run dry runs before opening wider traffic.",
  },
  {
    title: "Press readiness",
    body: "Prepare product screenshots, host stories, and a clear narrative around field use, compliance, and landowner control.",
  },
];

export default function BetaLaunchPage() {
  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="rounded-[1.9rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/65">
            Sprint 1.9
          </p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Beta launch preparation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/75">
            This surface turns the launch work into something visible inside the app: recruitment focus, readiness checks, and the story we want hosts, guests, and press to understand.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/marketing"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
            >
              Open marketing dashboard
            </Link>
            <Link
              href="/listings/fishing/nearby"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Try mobile fishing flow
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {betaSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                Ready for review
              </p>
              <h2 className="mt-3 text-2xl text-[var(--forest)]">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Launch checklist
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Run Playwright smoke tests on public, legal, and auth surfaces.
              </p>
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Review OWASP and GDPR launch checklists before beta invitations go out.
              </p>
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Dry-run one hunting listing and one instant-fishing listing end to end.
              </p>
              <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Prepare screenshots and host stories for outreach.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Beta story
            </p>
            <p className="mt-4 text-base leading-7 text-[var(--foreground)]">
              Heyra is no longer only a plan. The beta should show a working loop:
              hosts can publish and market access, guests can discover and book it,
              and both sides can rely on field-ready rules, proof pages, and post-trip trust signals.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
