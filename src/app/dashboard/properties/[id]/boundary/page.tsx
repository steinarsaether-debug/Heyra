import { auth } from "@/auth";
import { BoundaryEditor } from "@/components/property/boundary-editor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function parseCadastralRef(cadastralRef: string) {
  const normalized = cadastralRef.trim();
  const withMunicipality =
    normalized.match(/^(\d{4})-(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/) ??
    normalized.match(/^(\d{4})[:\s](\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/);

  if (withMunicipality) {
    return {
      municipalityCode: withMunicipality[1] ?? "",
      gnr: withMunicipality[2] ?? "",
      bnr: withMunicipality[3] ?? "",
      festenr: withMunicipality[4] ?? "",
      snr: withMunicipality[5] ?? "",
    };
  }

  const simple = normalized.match(/^(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/);

  if (simple) {
    return {
      municipalityCode: "",
      gnr: simple[1] ?? "",
      bnr: simple[2] ?? "",
      festenr: simple[3] ?? "",
      snr: simple[4] ?? "",
    };
  }

  return {
    municipalityCode: "",
    gnr: "",
    bnr: "",
    festenr: "",
    snr: "",
  };
}

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
      boundarySource: true,
      boundarySourceLabel: true,
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
            Start with either a manual boundary or a Kartverket parcel import, then add separate hunting, fishing, and access layers if the actual offer area differs from the cadastral parcel.
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
          <BoundaryEditor
            propertyId={property.id}
            initialParcelSearch={parseCadastralRef(property.cadastralRef)}
          />

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Why this first version works
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                You can import a parcel, edit it manually, and still save a working boundary without learning a full GIS tool.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                The system stores parcel provenance, a PostGIS boundary, and separate rights overlays for later search and map work.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Public listing maps can later prefer a hunting or fishing rights layer instead of showing raw cadastral detail.
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
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Current source:{" "}
              {property.boundarySource === "KARTVERKET_IMPORT"
                ? property.boundarySourceLabel ?? "Kartverket parcel import"
                : "Manual boundary"}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
