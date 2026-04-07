import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Onboarding
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Create a Heyra account and choose your starting role.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            Registration now stores the user record, basic PII profile, and the
            first legal consent records so later onboarding steps have a real
            account foundation.
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Account Setup
          </p>
          <div className="mt-5">
            <RegisterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
