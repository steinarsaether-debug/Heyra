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
            Grensesteg
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Legg inn kartgrensen for {property.cadastralRef}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Start med manuell grense eller Kartverket-import, og legg deretter til egne jakt-, fiske- og adkomstlag hvis det faktiske tilbudsområdet avviker fra matrikkelteigen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
            >
              Tilbake til eiendomsoversikt
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
              Hvorfor denne første versjonen fungerer
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Du kan importere en teig, justere den manuelt og fortsatt lagre en fungerende grense uten å lære et fullt GIS-verktøy.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Systemet lagrer teiggrunnlag, en PostGIS-grense og egne rettighetslag for senere søk og kartarbeid.
              </li>
              <li className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Offentlige annonsekart kan senere prioritere et jakt- eller fiskerettighetslag i stedet for rå matrikkeldetaljer.
              </li>
            </ul>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Stedskontekst
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {property.municipality}, {property.county}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Gjeldende kilde:{" "}
              {property.boundarySource === "KARTVERKET_IMPORT"
                ? property.boundarySourceLabel ?? "Kartverket-import"
                : "Manuell grense"}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
