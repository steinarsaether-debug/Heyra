import Link from "next/link";

type Highlight = {
  label: string;
  value: string;
};

type Action = {
  href: string;
  label: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  highlights,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  highlights: Highlight[];
  actions: Action[];
}) {
  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/76 sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)] transition hover:bg-[var(--background)]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((highlight) => (
            <article
              key={highlight.label}
              className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                {highlight.label}
              </p>
              <p className="mt-3 text-xl leading-8 text-[var(--foreground)]">
                {highlight.value}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
