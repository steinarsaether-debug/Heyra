import { auth } from "@/auth";
import {
  formatPropertyStatus,
  formatTerrainTypes,
  getPropertyCompletionState,
} from "@/lib/property-view";
import { getPropertyCwdSummary } from "@/lib/cwd-zones";
import { formatListingStatus } from "@/lib/listing-view";
import { getPropertyBoundaryStatus } from "@/lib/property-boundary-status";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
  const completion = getPropertyCompletionState({
    ...property,
    boundary: hasBoundary ? {} : null,
    centerPoint: hasBoundary ? {} : null,
  });
  const infrastructure = property.infrastructure as Record<string, boolean> | null;
  const listing = property.listings[0] ?? null;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
              Property draft
            </p>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{property.cadastralRef}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              This is now the working home for your draft property. Keep moving through one next step at a time instead of trying to complete every detail in one sitting.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/properties/${property.id}/boundary`}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
              >
                Add boundary step
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/listing`}
                className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Manage listing
              </Link>
              <Link
                href="/dashboard/properties"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Back to my properties
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--border)] bg-white/75 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
              Setup progress
            </p>
            <p className="mt-4 text-5xl text-[var(--forest)]">{completion.percent}%</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {completion.completed} of {completion.total} property setup steps complete
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
              Location
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{property.municipality}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              County
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{property.county}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Area
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{property.areaHectares} ha</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Property summary
            </p>
            <dl className="mt-4 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Terrain</dt>
                <dd>{formatTerrainTypes(property.terrainTypes)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Boundary captured</dt>
                <dd>
                  {completion.hasBoundary
                    ? property.boundarySource === "KARTVERKET_IMPORT"
                      ? `Yes · imported from ${property.boundarySourceLabel ?? "Kartverket"}`
                      : "Yes · manual or adjusted"
                    : "Not yet"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Rights and access layers</dt>
                <dd>
                  {property.rightsOverlays.length > 0
                    ? `${property.rightsOverlays.length} layer${property.rightsOverlays.length === 1 ? "" : "s"} stored`
                    : "No separate hunting, fishing, or access layers yet"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Facilities</dt>
                <dd>
                  {[
                    infrastructure?.hasCabins ? "Cabins" : null,
                    infrastructure?.hasBoats ? "Boats" : null,
                    infrastructure?.hasHides ? "Hides" : null,
                    infrastructure?.hasButcheringFacility ? "Butchering facility" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No facilities marked yet"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Listing</dt>
                <dd>{listing ? formatListingStatus(listing.status) : "No listing draft yet"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Vald context</dt>
                <dd>
                  {property.vald
                    ? `${property.vald.name} · Representative: ${property.vald.representativeName}`
                    : "No vald or shared hunting area attached"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Confidence</dt>
                <dd>
                  Geometry {property.geometryConfidence.toLowerCase()} · Rights {property.rightsConfidence.toLowerCase()} · Governance {property.governanceConfidence.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Boundary and rights notes</dt>
                <dd>
                  {[
                    property.boundaryIsApproximate ? "Boundary is approximate" : null,
                    property.rightsDifferFromBoundary ? "Rights may differ from mapped property" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No special boundary or rights warning stored"}
                </dd>
              </div>
              {property.vald ? (
                <>
                  <div>
                    <dt className="font-semibold text-[var(--foreground)]">Vald verification</dt>
                    <dd>
                      {property.vald.verificationMethod.replaceAll("_", " ").toLowerCase()} · confidence {property.vald.dataConfidence.toLowerCase()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--foreground)]">Representative confirmation</dt>
                    <dd>{property.vald.representativeConfirmationStatus.replaceAll("_", " ").toLowerCase()}</dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="font-semibold text-[var(--foreground)]">CWD status</dt>
                <dd>
                  {cwdSummary.isInCwdZone
                    ? `Inside monitoring zone: ${cwdSummary.cwdZoneName ?? "Unnamed zone"}`
                    : "No overlapping CWD zone stored"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Recommended next steps
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              {completion.steps.map((step) => (
                <div key={step.key} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  {step.complete ? "Complete" : "Needed"}: {step.label}
                </div>
              ))}
              <Link
                href={`/dashboard/properties/${property.id}/boundary`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Continue with the boundary step
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/listing`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Continue with the listing and approval step
              </Link>
              <Link
                href={`/dashboard/properties/${property.id}/insights`}
                className="block rounded-2xl border border-[var(--border)] px-4 py-3 font-semibold text-[var(--forest)]"
              >
                Review promotion insights
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
