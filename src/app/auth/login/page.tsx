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
            Authentication
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Sign in to manage listings, bookings, and compliance.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            This first auth flow uses local credentials and a role-aware session
            so we can wire the rest of the app against real users before BankID
            and Vipps enter the picture.
          </p>
        </div>

        <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
            Credentials Login
          </p>
          <div className="mt-5">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
