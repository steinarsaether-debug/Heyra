import Link from "next/link";
import { CancellationPolicy, ComplianceTaskStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShareToolkit } from "@/components/share/share-toolkit";
import { DeleteListingButton } from "@/components/property/delete-listing-button";
import { canManageProperties } from "@/lib/access";
import {
  formatComplianceDueLabel,
  formatComplianceTaskStatus,
  formatComplianceTaskType,
} from "@/lib/compliance-view";
import { getPropertyBoundaryStatus } from "@/lib/property-boundary-status";
import { ListingEditor } from "@/components/property/listing-editor";
import { prisma } from "@/lib/prisma";
import { summarizeAttributedBookings } from "@/lib/share-attribution";
import { buildListingSocialImageUrl } from "@/lib/seo";
import {
  buildLandownerCampaignPresets,
  buildLandownerShareCaption,
  buildShareLinks,
  buildTrackedShareUrl,
} from "@/lib/share";

export default async function PropertyListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!canManageProperties(session)) {
    redirect("/dashboard");
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
        orderBy: [
          { visibility: "asc" },
          { title: "asc" },
        ],
        select: {
          id: true,
          title: true,
          overlayType: true,
          visibility: true,
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
    redirect("/dashboard/properties");
  }

  const hasBoundary = await getPropertyBoundaryStatus(property.id, session.user.id);
  const listing = property.listings[0] ?? null;
  const publicShareUrl =
    listing?.slug
      ? buildTrackedShareUrl(`/listings/${listing.slug}`, {
          source: "landowner",
          campaign: "profile-share",
        })
      : null;
  const landownerCaption =
    listing && publicShareUrl
      ? buildLandownerShareCaption({
          title: listing.title,
          municipality: property.municipality,
          county: property.county,
          type: listing.type,
        })
      : null;
  const shareLinks =
    listing && publicShareUrl && landownerCaption
      ? buildShareLinks({
          shareUrl: publicShareUrl,
          title: listing.title,
          caption: landownerCaption,
        })
      : null;
  const campaignPresets =
    listing?.status === "PUBLISHED"
      ? buildLandownerCampaignPresets({
          slug: listing.slug,
          title: listing.title,
          municipality: property.municipality,
          county: property.county,
          type: listing.type,
        })
      : [];
  const socialPreviewUrl = listing?.slug ? buildListingSocialImageUrl(listing.slug) : undefined;
  const attributedBookings = listing
    ? await prisma.booking.findMany({
        where: {
          listingId: listing.id,
        },
        select: {
          id: true,
          status: true,
          hunterAttestations: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];
  const attributionSummary = summarizeAttributedBookings(attributedBookings);
  const complianceTasks = listing
    ? await prisma.complianceTask.findMany({
        where: {
          userId: session.user.id,
          listingId: listing.id,
          status: {
            in: [ComplianceTaskStatus.OPEN, ComplianceTaskStatus.IN_PROGRESS],
          },
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 3,
      })
    : [];

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Annonsearbeid
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Klargjør en offentlig annonse for {property.cadastralRef}.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Dette er steget etter eiendomsoppsettet. Form tilbudet her, og send det til gjennomgang når beskrivelse, arter, bilder og pris er klare.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Tilbake til eiendommen
            </Link>
            <Link
              href={`/dashboard/properties/${property.id}/boundary`}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
            >
              Se over grensen
            </Link>
            {listing ? <DeleteListingButton propertyId={property.id} /> : null}
          </div>
        </div>

        {!hasBoundary ? (
          <div className="rounded-[1.6rem] border border-[#e7d6ae] bg-[#fff8eb] p-5 text-sm leading-7 text-[#6e5630]">
            Denne eiendommen har ingen lagret grense ennå. Du kan fortsatt lage annonseutkast nå, men grensesteget bør fullføres før annonsen regnes som klar for gjennomgang.
          </div>
        ) : null}

        {listing?.status === "PUBLISHED" && publicShareUrl && landownerCaption && shareLinks ? (
          <ShareToolkit
            heading="Markedsføringspakke for grunneier"
            description="Bruk denne offentlige annonselenken og ferdige tekstforslag når du vil promotere eiendommen i egne kanaler. Lenken har enkle delingskoder slik at senere rapportering kan skille egen trafikk fra annet."
            shareUrl={publicShareUrl}
            nativeTitle={listing.title}
            nativeText={landownerCaption}
            links={shareLinks}
            campaignPresets={campaignPresets}
            socialPreviewUrl={socialPreviewUrl}
            captionOptions={[
              {
                label: "Facebook / generell post",
                text: landownerCaption,
              },
              {
                label: "Kort bildetekst",
                text: `${listing.title} i ${property.municipality}. Offentlig annonse på Heyra: ${publicShareUrl}`,
              },
            ]}
          />
        ) : null}

        {listing?.status === "PUBLISHED" ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Signaler fra deling
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Denne første versjonen sporer bestillinger som kom inn via merkede delingslenker. Det er ikke full trafikkanalyse ennå, men det viser om egen promotering begynner å bli til bestillingsforesporsler.
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)] sm:grid-cols-2">
              {(() => {
                const totalBookings = attributedBookings.length;
                const attributedCount = attributionSummary.lastTouch.reduce((sum, item) => sum + item.count, 0);
                const attributedRate = totalBookings
                  ? Math.round((attributedCount / totalBookings) * 100)
                  : 0;

                return (
                  <>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <p className="font-semibold">Tilknyttede bestillinger</p>
                <p className="mt-1 text-[var(--muted)]">
                  {attributedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <p className="font-semibold">Delingsandel</p>
                <p className="mt-1 text-[var(--muted)]">{attributedRate}%</p>
              </div>
                  </>
                );
              })()}
            </div>
            <div className="mt-4">
              <Link
                href={`/dashboard/properties/${property.id}/insights`}
                className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
              >
                Åpne markedsinnsikt
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {attributionSummary.lastTouch.length > 0 ? (
                attributionSummary.lastTouch.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                  >
                    <span className="font-semibold">{item.label}</span>: {item.count} bestillingsforespørsel{item.count === 1 ? "" : "er"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  Ingen bestillinger er knyttet til merkede delingslenker ennå.
                </div>
              )}
            </div>
          </article>
        ) : null}

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
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
                  <p className="mt-1 text-[var(--muted)]">{formatComplianceDueLabel(task.dueAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {task.actionUrl ? (
                      <Link
                        href={task.actionUrl}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        {task.actionLabel ?? "Åpne oppgave"}
                      </Link>
                    ) : null}
                    <Link
                      href="/dashboard/compliance"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      Se hele etterlevelsen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Ingen åpne etterlevelsesoppgaver er knyttet til denne annonsen akkurat nå.
            </p>
          )}
        </article>

        <ListingEditor
          property={{
            id: property.id,
            cadastralRef: property.cadastralRef,
            municipality: property.municipality,
            county: property.county,
            status: property.status,
            hasBoundary,
            geometryConfidence: property.geometryConfidence,
            rightsConfidence: property.rightsConfidence,
            governanceConfidence: property.governanceConfidence,
            boundaryIsApproximate: property.boundaryIsApproximate,
            rightsDifferFromBoundary: property.rightsDifferFromBoundary,
            rightsOverlays: property.rightsOverlays,
            vald: property.vald
              ? {
                  id: property.vald.id,
                  name: property.vald.name,
                  municipality: property.vald.municipality,
                  county: property.vald.county,
                  representativeName: property.vald.representativeName,
                  localReference: property.vald.localReference,
                  verificationMethod: property.vald.verificationMethod,
                  dataConfidence: property.vald.dataConfidence,
                  representativeConfirmationStatus: property.vald.representativeConfirmationStatus,
                  coApprovalRequired: property.vald.coApprovalRequired,
                }
              : null,
          }}
          complianceTasks={complianceTasks.map((task) => ({
            id: task.id,
            title: task.title,
            taskTypeLabel: formatComplianceTaskType(task.taskType),
            statusLabel: formatComplianceTaskStatus(task.status),
            dueLabel: formatComplianceDueLabel(task.dueAt),
            actionLabel: task.actionLabel,
            actionUrl: task.actionUrl,
          }))}
          listing={
            listing
              ? {
                  id: listing.id,
                  slug: listing.slug,
                  type: listing.type,
                  title: listing.title,
                  description: listing.description,
                  species: listing.species,
                  pricingModel: listing.pricingModel,
                  priceNok: listing.priceNok,
                  maxGroupSize: listing.maxGroupSize,
                  minNights: listing.minNights,
                  photos: listing.photos,
                  instantBookEnabled: listing.instantBookEnabled,
                  cancellationPolicy: listing.cancellationPolicy ?? CancellationPolicy.MODERATE,
                  governanceModel: listing.governanceModel,
                  coApprovalRequired: listing.coApprovalRequired,
                  governanceNotes: listing.governanceNotes,
                  governanceEvidenceNotes: listing.governanceEvidenceNotes,
                  municipalityProcessNotes: listing.municipalityProcessNotes,
                  reviewerNotes: listing.reviewerNotes,
                  quota: {
                    summary:
                      (listing.quota as { summary?: string } | null)?.summary ?? "",
                    availabilitySummary:
                      (listing.quota as { availabilitySummary?: string } | null)?.availabilitySummary ?? "",
                    permitNotes:
                      (listing.quota as { permitNotes?: string } | null)?.permitNotes ?? "",
                    reportingNotes:
                      (listing.quota as { reportingNotes?: string } | null)?.reportingNotes ?? "",
                    reportingResponsibility:
                      (listing.quota as { reportingResponsibility?: string } | null)?.reportingResponsibility ?? "",
                  },
                  rules: {
                    speciesRestrictions:
                      (listing.rules as { speciesRestrictions?: string } | null)?.speciesRestrictions ?? "",
                    gearRules:
                      (listing.rules as { gearRules?: string } | null)?.gearRules ?? "",
                    bagLimitNotes:
                      (listing.rules as { bagLimitNotes?: string } | null)?.bagLimitNotes ?? "",
                    areaNotes:
                      (listing.rules as { areaNotes?: string } | null)?.areaNotes ?? "",
                    requiresNationalFishingLicense:
                      (listing.rules as { requiresNationalFishingLicense?: boolean } | null)?.requiresNationalFishingLicense ?? false,
                    publicRightsOverlayId:
                      (listing.rules as { publicRightsOverlayId?: string | null } | null)?.publicRightsOverlayId ?? null,
                  },
                  availabilityCalendar: {
                    seasonNotes:
                      (listing.availabilityCalendar as { seasonNotes?: string } | null)?.seasonNotes ?? "",
                    blockedRanges:
                      (listing.availabilityCalendar as {
                        blockedRanges?: Array<{ startDate: string; endDate: string; label?: string }>;
                      } | null)?.blockedRanges ?? [],
                  },
                  status: listing.status,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
