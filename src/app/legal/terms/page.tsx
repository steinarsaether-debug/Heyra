export default function TermsPage() {
  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--amber)]">
          Terms
        </p>
        <h1 className="mt-4 text-4xl text-[var(--forest)] sm:text-5xl">Marketplace terms for Heyra</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-[var(--foreground)]">
          <p>
            Heyra acts as a marketplace facilitator. Landowners publish access opportunities, hunters request bookings, and both parties manage the workflow through the platform.
          </p>
          <p>
            A listing does not guarantee a booking. A booking request becomes active only when the landowner approves it and any later legal, payment, or contract requirements are completed.
          </p>
          <p>
            Landowners are responsible for the accuracy of listing details, property boundaries, and practical hunting access information. Hunters are responsible for providing truthful request details and following local rules, licensing obligations, and safety expectations.
          </p>
          <p>
            Compliance alerts such as CWD zone overlap are informational workflow aids. They do not replace the parties’ own legal responsibilities.
          </p>
        </div>
      </section>
    </main>
  );
}
