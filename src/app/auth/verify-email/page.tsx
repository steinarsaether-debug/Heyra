import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto max-w-3xl">
        <VerifyEmailForm />
      </section>
    </main>
  );
}
