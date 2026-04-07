import Link from "next/link";
import { CancellationPolicy } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShareToolkit } from "@/components/share/share-toolkit";
import { canManageProperties } from "@/lib/access";
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

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Listing workspace
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Prepare a public listing for {property.cadastralRef}.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              This is the step after property setup. Shape the public offer here, then send it into review when the description, species, photos, and price are ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Back to property
            </Link>
            <Link
              href={`/dashboard/properties/${property.id}/boundary`}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
            >
              Review boundary
            </Link>
          </div>
        </div>

        {!hasBoundary ? (
          <div className="rounded-[1.6rem] border border-[#e7d6ae] bg-[#fff8eb] p-5 text-sm leading-7 text-[#6e5630]">
            This property does not have a saved boundary yet. You can still draft the listing now, but the boundary step should be completed before the listing is treated as ready for review.
          </div>
        ) : null}

        {listing?.status === "PUBLISHED" && publicShareUrl && landownerCaption && shareLinks ? (
          <ShareToolkit
            heading="Landowner marketing kit"
            description="Use this public listing link and ready-made text when you want to promote the property from your own social accounts. The link includes simple share tags so later reporting can distinguish owner-driven traffic."
            shareUrl={publicShareUrl}
            nativeTitle={listing.title}
            nativeText={landownerCaption}
            links={shareLinks}
            campaignPresets={campaignPresets}
            socialPreviewUrl={socialPreviewUrl}
            captionOptions={[
              {
                label: "Facebook / general post",
                text: landownerCaption,
              },
              {
                label: "Short caption",
                text: `${listing.title} in ${property.municipality}. Public listing on Heyra: ${publicShareUrl}`,
              },
            ]}
          />
        ) : null}

        {listing?.status === "PUBLISHED" ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Promotion signals
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              This first version tracks bookings that came through tagged share links. It is not full traffic analytics yet, but it shows whether your own promotion is starting to convert into booking requests.
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
                <p className="font-semibold">Attributed bookings</p>
                <p className="mt-1 text-[var(--muted)]">
                  {attributedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <p className="font-semibold">Attributed share rate</p>
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
                Open promotion insights
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {attributionSummary.lastTouch.length > 0 ? (
                attributionSummary.lastTouch.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                  >
                    <span className="font-semibold">{item.label}</span>: {item.count} booking request{item.count === 1 ? "" : "s"}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  No bookings have been attributed to tagged share links yet.
                </div>
              )}
            </div>
          </article>
        ) : null}

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
