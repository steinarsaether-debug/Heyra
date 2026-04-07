import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Innlogging
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Logg inn for å håndtere annonser, bestillinger og etterlevelse.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            Denne første innloggingsflyten bruker lokale brukernavn og passord,
            med rolletilpasset økt, slik at resten av appen kan bygges rundt ekte
            brukere før BankID og Vipps kommer på plass.
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Innlogging med e-post
          </p>
          <div className="mt-5">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
