import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 md:px-8">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-6 shadow-[0_18px_40px_rgba(16,42,33,0.06)] sm:p-8">
        <div className="mb-6 rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(10,25,22,0.92),rgba(10,25,22,0.72))] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
            Nytt passord
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">
            Oppdater passordet og fortsett der du slapp.
          </h1>
        </div>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
