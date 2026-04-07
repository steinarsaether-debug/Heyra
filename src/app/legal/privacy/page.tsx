export default function PrivacyPage() {
  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[var(--border)] bg-white/80 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--amber)]">
          Privacy
        </p>
        <h1 className="mt-4 text-4xl text-[var(--forest)] sm:text-5xl">How Heyra handles personal data</h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-[var(--foreground)]">
          <p>
            Heyra stores the minimum information needed to run the marketplace: account identity, role, profile details, property drafts, listings, bookings, consent records, and compliance flags such as CWD zone overlap.
          </p>
          <p>
            We separate sensitive profile data into protected records and keep legal consent history versioned. Optional marketing consent is separate from the terms and privacy consents required to use the service.
          </p>
          <p>
            Local development may store uploaded listing photos on the same machine as the app. Production storage, verification providers, and payment processors will be documented here before launch.
          </p>
          <p>
            If you want to review or correct your profile data, use the dashboard profile pages. If you want to stop optional marketing consent, update the cookie preferences banner or future account settings.
          </p>
        </div>
      </section>
    </main>
  );
}
