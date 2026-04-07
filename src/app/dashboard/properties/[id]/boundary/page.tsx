import { auth } from "@/auth";
import { BoundaryEditor } from "@/components/property/boundary-editor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function PropertyBoundaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      cadastralRef: true,
      municipality: true,
      county: true,
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Boundary step
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Add the map boundary for {property.cadastralRef}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            This route is the next landing zone for map drawing. For now it gives landowners a calm explanation of what comes next, instead of dropping them into a technical GIS task without context.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
            >
              Back to property overview
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <BoundaryEditor propertyId={property.id} />

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Why this first version works
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                You can save a real boundary today without learning a full GIS tool.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                The system stores a PostGIS polygon and center point for later search and map work.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                A future map-based editor can refine the same geometry later.
              </li>
            </ul>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Location context
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {property.municipality}, {property.county}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
