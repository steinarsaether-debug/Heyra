import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 md:px-8">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[2rem] text-[var(--background)] shadow-[0_24px_60px_rgba(16,42,33,0.12)]">
          <div
            className="h-full p-8 sm:p-10"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(10,25,22,0.9), rgba(10,25,22,0.64)), url(https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80)",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
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
        </div>

        <div className="rounded-[2rem] border border-[rgba(16,42,33,0.08)] bg-[rgba(255,255,255,0.86)] p-8 shadow-[0_18px_40px_rgba(16,42,33,0.06)]">
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
