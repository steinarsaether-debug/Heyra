import { auth } from "@/auth";
import {
  formatConfidenceLevel,
  formatPropertyStatus,
  formatSharedApprovalStatus,
  formatTerrainTypes,
  formatValdVerificationMethod,
  getPropertyCompletionState,
} from "@/lib/property-view";
import { formatParcelSelectionSummary } from "@/lib/parcel-selection-view";
import { DeletePropertyButton } from "@/components/property/delete-property-button";
import { PropertyIdentityEditor } from "@/components/property/property-identity-editor";
import {
  formatComplianceDueLabel,
  formatComplianceTaskStatus,
  formatComplianceTaskType,
} from "@/lib/compliance-view";
import { getPropertyCwdSummary } from "@/lib/cwd-zones";
import { formatListingStatus } from "@/lib/listing-view";
import { getPropertyBoundaryStatus } from "@/lib/property-boundary-status";
import { ComplianceTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function formatHectares(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Ikke beregnet ennå";
  }

  return `${new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 1 : 2,
  }).format(value)} ha`;
}

function getAreaDifferencePercent(statedAreaHectares: number, importedAreaHectares: number | null) {
  if (!importedAreaHectares || statedAreaHectares <= 0) {
    return null;
  }

  return Math.round((Math.abs(importedAreaHectares - statedAreaHectares) / statedAreaHectares) * 100);
}

export default async function PropertyDetailPage({
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
    include: {
      vald: true,
      rightsOverlays: {
        select: {
          id: true,
          title: true,
          overlayType: true,
          visibility: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      parcelSelections: {
        select: {
          id: true,
          title: true,
          groupKind: true,
          isIncluded: true,
        },
        orderBy: [{ isIncluded: "desc" }, { title: "asc" }],
      },
      listings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!property) {
    notFound();
  }

  const hasBoundary = await getPropertyBoundaryStatus(property.id, session.user.id);
  const cwdSummary = await getPropertyCwdSummary(property.id);
  const complianceTasks = await prisma.complianceTask.findMany({
    where: {
      userId: session.user.id,
      status: {
        in: [ComplianceTaskStatus.OPEN, ComplianceTaskStatus.IN_PROGRESS],
      },
      OR: [
        {
          listing: {
            propertyId: property.id,
          },
        },
        {
          booking: {
            listing: {
              propertyId: property.id,
            },
          },
        },
      ],
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      taskType: true,
      status: true,
      dueAt: true,
      actionLabel: true,
      actionUrl: true,
      listing: {
        select: {
          propertyId: true,
        },
      },
      booking: {
        select: {
          id: true,
        },
      },
    },
  });
  const completion = getPropertyCompletionState({
    ...property,
    boundary: hasBoundary ? {} : null,
    centerPoint: hasBoundary ? {} : null,
  });
  const infrastructure = property.infrastructure as Record<string, boolean> | null;
  const listing = property.listings[0] ?? null;
  const samePropertySelections = property.parcelSelections.filter(
    (selection) => selection.groupKind === "SAME_PROPERTY",
  );
  const includedSelections = samePropertySelections.filter((selection) => selection.isIncluded);
  const nearbySelections = property.parcelSelections.filter(
    (selection) => selection.groupKind === "NEARBY",
  );
  const areaDifferencePercent = getAreaDifferencePercent(
    property.areaHectares,
    property.kartverketAreaHectares,
  );

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Eiendomsutkast
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{property.cadastralRef}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Dette er arbeidsflaten for eiendomsutkastet ditt. Ta ett neste steg av gangen i stedet for å prøve å fullføre alt i samme økt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/properties/${property.id}/boundary`}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
              >
                Gå til grensesteg
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/listing`}
                className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Arbeid med annonse
              </Link>
              <Link
                href="/dashboard/properties"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Tilbake til mine eiendommer
              </Link>
            </div>
            <div className="mt-4">
              <DeletePropertyButton propertyId={property.id} />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Oppsettsfremdrift
            </p>
            <p className="mt-4 text-5xl text-[var(--forest)]">{completion.percent}%</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {completion.completed} av {completion.total} oppsettssteg er fullført
            </p>
            <div className="mt-5 h-3 rounded-full bg-[#e7e1d5]">
              <div
                className="h-3 rounded-full bg-[var(--amber)]"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Status
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatPropertyStatus(property.status)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Kommune
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{property.municipality}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Fylke
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{property.county}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Oppgitt areal
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{formatHectares(property.areaHectares)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Kartverket-areal
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {formatHectares(property.kartverketAreaHectares)}
            </p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Eiendomsoversikt
            </p>
            <dl className="mt-4 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Arealgrunnlag</dt>
                <dd>
                  Oppgitt areal: {formatHectares(property.areaHectares)}
                  {property.kartverketAreaHectares ? (
                    <>
                      {" · "}Kartverket-beregnet areal: {formatHectares(property.kartverketAreaHectares)}
                      {areaDifferencePercent !== null ? ` · avvik ${areaDifferencePercent}%` : ""}
                    </>
                  ) : (
                    " · Ingen Kartverket-beregning lagret ennå"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Terreng</dt>
                <dd>{formatTerrainTypes(property.terrainTypes)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Grense registrert</dt>
                <dd>
                  {completion.hasBoundary
                    ? property.boundarySource === "KARTVERKET_IMPORT"
                      ? `Ja · importert fra ${property.boundarySourceLabel ?? "Kartverket"}`
                      : "Ja · manuelt tegnet eller justert"
                    : "Ikke ennå"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Teigvalg for jaktterreng</dt>
                <dd>
                  {samePropertySelections.length > 0
                    ? formatParcelSelectionSummary({
                        totalCount: samePropertySelections.length,
                        includedCount: includedSelections.length,
                        nearbyCount: nearbySelections.length,
                      })
                    : "Ingen lagrede teigvalg ennå"}
                </dd>
                {includedSelections.length > 0 ? (
                  <dd>
                    Valgt nå: {includedSelections.slice(0, 4).map((selection) => selection.title).join(" · ")}
                    {includedSelections.length > 4
                      ? ` + ${includedSelections.length - 4} til`
                      : ""}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Rettighets- og adkomstlag</dt>
                <dd>
                  {property.rightsOverlays.length > 0
                    ? `${property.rightsOverlays.length} lag lagret`
                    : "Ingen egne jakt-, fiske- eller adkomstlag ennå"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Fasiliteter</dt>
                <dd>
                  {[
                    infrastructure?.hasCabins ? "Hytter" : null,
                    infrastructure?.hasBoats ? "Båter" : null,
                    infrastructure?.hasHides ? "Skjul" : null,
                    infrastructure?.hasButcheringFacility ? "Slakteplass" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Ingen fasiliteter markert ennå"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Annonse</dt>
                <dd>{listing ? formatListingStatus(listing.status) : "Ingen annonseutkast ennå"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Vald-kontekst</dt>
                <dd>
                  {property.vald
                    ? `${property.vald.name} · Representant: ${property.vald.representativeName}`
                    : "Ingen vald- eller fellesjaktkontekst koblet til"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Tillit og datagrunnlag</dt>
                <dd>
                  Geometri {formatConfidenceLevel(property.geometryConfidence)} · rettigheter {formatConfidenceLevel(property.rightsConfidence)} · styring {formatConfidenceLevel(property.governanceConfidence)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Notater om grense og rettigheter</dt>
                <dd>
                  {[
                    property.boundaryIsApproximate ? "Grensen er omtrentelig" : null,
                    property.rightsDifferFromBoundary ? "Rettighetene kan avvike fra kartlagt eiendom" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Ingen spesielle merknader om grense eller rettigheter er lagret"}
                </dd>
              </div>
              {property.vald ? (
                <>
                  <div>
                    <dt className="font-semibold text-[var(--foreground)]">Vald-verifisering</dt>
                    <dd>
                      {formatValdVerificationMethod(property.vald.verificationMethod)} · tillit {formatConfidenceLevel(property.vald.dataConfidence)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--foreground)]">Representantbekreftelse</dt>
                    <dd>{formatSharedApprovalStatus(property.vald.representativeConfirmationStatus)}</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="font-semibold text-[var(--foreground)]">CWD-status</dt>
                <dd>
                  {cwdSummary.isInCwdZone
                    ? `Innenfor overvåkingssone: ${cwdSummary.cwdZoneName ?? "Sone uten navn"}`
                    : "Ingen overlappende CWD-sone lagret"}
                </dd>
              </div>
            </dl>
            {areaDifferencePercent !== null && areaDifferencePercent >= 10 ? (
              <div className="mt-5 rounded-2xl border border-[var(--amber)]/25 bg-[var(--amber-soft)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                Kartverket-arealet avviker merkbart fra det oppgitte arealet. Det kan være helt greit dersom jakt- eller fiskerettene dekker mindre eller mer enn matrikkelteigen, men det er verdt å dobbeltsjekke før publisering.
              </div>
            ) : null}
            {samePropertySelections.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[#f8f5ee] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                Lagrede teigvalg kan senere brukes som grunnlag for vald-oversikt og for å vise hvilke deler av eiendommen som faktisk inngår i tilbudet.
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Anbefalte neste steg
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {completion.steps.map((step) => (
                <div key={step.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  {step.complete ? "Fullført" : "Mangler"}: {step.label}
                </div>
              ))}
              <Link
                href={`/dashboard/properties/${property.id}/boundary`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Fortsett med grensesteg
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/listing`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Fortsett med annonse- og godkjenningssteg
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/insights`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Se markedsinnsikt
              </Link>
            </div>
          </section>
        </div>

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Etterlevelse og påminnelser
          </p>
          {complianceTasks.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {complianceTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                >
                  <p className="font-semibold">
                    {formatComplianceTaskType(task.taskType)} · {formatComplianceTaskStatus(task.status)}
                  </p>
                  <p className="mt-1">{task.title}</p>
                  <p className="mt-1 text-[var(--muted)]">
                    {formatComplianceDueLabel(task.dueAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {task.actionUrl ? (
                      <Link
                        href={task.actionUrl}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        {task.actionLabel ?? "Åpne oppgave"}
                      </Link>
                    ) : (
                      <Link
                        href={task.booking ? `/dashboard/bookings/${task.booking.id}` : `/dashboard/properties/${property.id}/listing`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        {task.booking ? "Åpne bestilling" : "Åpne annonse"}
                      </Link>
                    )}
                    <Link
                      href="/dashboard/compliance"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      Se all etterlevelse
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Ingen åpne etterlevelsesoppgaver er knyttet til denne eiendommen akkurat nå.
            </p>
          )}
        </section>

        <PropertyIdentityEditor
          propertyId={property.id}
          initialValues={{
            cadastralRef: property.cadastralRef,
            municipality: property.municipality,
            county: property.county,
            areaHectares: property.areaHectares,
          }}
        />
      </section>
    </main>
  );
}
