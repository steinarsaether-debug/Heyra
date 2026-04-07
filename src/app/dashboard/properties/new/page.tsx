import { auth } from "@/auth";
import { PropertyWizard } from "@/components/property/property-wizard";
import { redirect } from "next/navigation";

export default async function NewPropertyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/properties/new");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Landowner onboarding
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Add your property one clear step at a time.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            This first version focuses on a calm, low-friction draft flow. We
            capture the basics now and leave maps, quotas, and publishing for
            later steps.
          </p>
        </div>

        <PropertyWizard />
      </section>
    </main>
  );
}
