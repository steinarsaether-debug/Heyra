import type { Metadata } from "next";
import { ComplianceTaskType, UserRole } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RequestBookingForm } from "@/components/booking/request-booking-form";
import { ReportButton } from "@/components/community/report-button";
import { FishingAreaWarning } from "@/components/fishing/fishing-area-warning";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { ShareAttributionNote } from "@/components/share/share-attribution-note";
import { ShareToolkit } from "@/components/share/share-toolkit";
import { TrustBadge } from "@/components/trust/trust-badge";
import { getBookingStatusGuidance, getBookingStatusLabel } from "@/lib/booking-view";
import {
  getComplianceTaskNextStep,
  getComplianceTaskWhy,
} from "@/lib/compliance";
import { normalizeListingAvailability } from "@/lib/listing-availability";
import {
  formatListingGovernanceModel,
  formatListingType,
  formatPricingModel,
  formatSpecies,
} from "@/lib/listing-view";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import {
  buildListingJsonLd,
  buildListingMetadataDescription,
  buildListingSocialImageUrl,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { buildShareLinks } from "@/lib/share";
import { formatServiceCategory, getNearbyServicesForListing } from "@/lib/service-view";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";

export const revalidate = 300;

type ListingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublishedListing(slug: string) {
  return prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      hunterExperiences: {
        where: {
          moderationStatus: "APPROVED",
        },
        include: {
          hunter: {
            select: {
              pii: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 6,
      },
      reviews: {
        where: {
          moderationStatus: "APPROVED",
          reviewerRole: "HUNTER",
        },
        include: {
          reviewer: {
            select: {
              pii: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 6,
      },
      property: {
        select: {
          cadastralRef: true,
          cwdZone: {
            select: {
              name: true,
              contactName: true,
              contactPhone: true,
              contactEmail: true,
              contactWebsite: true,
              samplingInstructions: true,
            },
          },
          vald: {
            select: {
              name: true,
              representativeName: true,
              municipality: true,
              county: true,
              bestandsplanName: true,
              coApprovalRequired: true,
              representativeConfirmationStatus: true,
            },
          },
          municipality: true,
          county: true,
          ownerId: true,
          areaHectares: true,
          terrainTypes: true,
          isInCwdZone: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: ListingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      description: true,
      slug: true,
      type: true,
      species: true,
      priceNok: true,
      photos: true,
      property: {
        select: {
          municipality: true,
          county: true,
        },
      },
    },
  });

  if (!listing) {
    return {
      title: "Listing not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = buildListingMetadataDescription({
    title: listing.title,
    municipality: listing.property.municipality,
    county: listing.property.county,
    type: listing.type,
    species: listing.species,
    priceNok: listing.priceNok,
  });
  const image = buildListingSocialImageUrl(listing.slug);

  return {
    title: listing.title,
    description,
    alternates: {
      canonical: absoluteUrl(`/listings/${listing.slug}`),
    },
    openGraph: {
      title: listing.title,
      description,
      url: absoluteUrl(`/listings/${listing.slug}`),
      type: "article",
      images: [{ url: image, alt: listing.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description,
      images: [image],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const session = await auth();
  const { slug } = await params;
  const listing = await getPublishedListing(slug);

  if (!listing) {
    notFound();
  }

  const listingJsonLd = buildListingJsonLd({
    title: listing.title,
    description: listing.description,
    slug: listing.slug,
    municipality: listing.property.municipality,
    county: listing.property.county,
    type: listing.type,
    species: listing.species,
    pricingModel: listing.pricingModel,
    priceNok: listing.priceNok,
    photos: listing.photos,
  });
  const genericShareUrl = absoluteUrl(`/listings/${listing.slug}`);
  const genericShareCaption = buildListingMetadataDescription({
    title: listing.title,
    municipality: listing.property.municipality,
    county: listing.property.county,
    type: listing.type,
    species: listing.species,
    priceNok: listing.priceNok,
  });
  const genericShareLinks = buildShareLinks({
    shareUrl: genericShareUrl,
    title: listing.title,
    caption: genericShareCaption,
  });

  const availability = normalizeListingAvailability(listing.availabilityCalendar);
  const averageRating = getAverageRating(listing.reviews.map((review) => review.rating));
  const trustSummary = getTrustSummary({
    averageRating,
    reviewCount: listing.reviews.length,
  });
  const ownerBookingStats = await prisma.booking.findMany({
    where: {
      listing: {
        property: {
          ownerId: listing.property.ownerId,
        },
      },
    },
    select: {
      status: true,
    },
  });
  const hostBadge = getHostQualityBadge({
    averageRating,
    approvedReviewCount: listing.reviews.length,
    cancelledBookings: ownerBookingStats.filter((booking) => booking.status === "CANCELLED").length,
    totalBookings: ownerBookingStats.length,
  });
  const nearbyServices = await getNearbyServicesForListing(prisma, listing.id);

  const existingRequest = session?.user
    ? await prisma.booking.findFirst({
        where: {
          listingId: listing.id,
          hunterId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : null;
  const showsFishingFeeReminder =
    listing.type === "FISHING" &&
    ((listing.rules as { requiresNationalFishingLicense?: boolean } | null)
      ?.requiresNationalFishingLicense ||
      listing.species.some((entry) => entry === "LAKS" || entry === "SJOOERRET"));
  const showsSalmonReportingReminder =
    listing.type === "FISHING" &&
    listing.species.some((entry) => entry === "LAKS" || entry === "SJOOERRET");
  const showsBigGameReportingReminder = listing.species.some(
    (entry) => entry === "ELG" || entry === "HJORT" || entry === "RADYR" || entry === "VILLREIN",
  );

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.8rem] bg-[var(--forest)] p-8 text-[var(--background)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
            Listing Detail
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{listing.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            {listing.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--forest)]"
            >
              Back to listings
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Open dashboard shell
            </Link>
            {listing.type === "FISHING" ? (
              <Link
                href={`/listings/${listing.slug}/field`}
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Open field mode
              </Link>
            ) : null}
            {listing.type === "FISHING" ? (
              <Link
                href="/listings/fishing/nearby"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                Nearby fishing
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <ShareAttributionNote listingId={listing.id} />
          <OfflinePageNote
            onlineText="This listing page is cached after you open it, which helps if you lose signal on the way to the property or river."
            offlineText="You are offline. This listing page is being shown from the local cache, so availability and booking status may not be fully current."
          />
          <OfflineFreshnessNote
            updatedAt={listing.updatedAt.toISOString()}
            label="This listing"
          />
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Public summary
            </p>
            <dl className="mt-3 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <div>
                <dt className="font-semibold">Offer type</dt>
                <dd>{formatListingType(listing.type)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Species</dt>
                <dd>{formatSpecies(listing.species)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Pricing</dt>
                <dd>
                  {formatPricingModel(listing.pricingModel)} · NOK {listing.priceNok.toLocaleString("nb-NO")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Checkout</dt>
                <dd>{listing.instantBookEnabled ? "Instant contract and payment flow" : "Approval before contract and payment"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Minimum stay</dt>
                <dd>{listing.minNights ? `${listing.minNights} nights` : "Flexible"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Approval model</dt>
                <dd>{formatListingGovernanceModel(listing.governanceModel)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Co-approval</dt>
                <dd>{listing.coApprovalRequired ? "Required before confirmation" : "Not marked as required"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Max group</dt>
                <dd>{listing.maxGroupSize} people</dd>
              </div>
              <div>
                <dt className="font-semibold">Hunter rating</dt>
                <dd>
                  {averageRating
                    ? `${averageRating.toFixed(1)} / 5 from ${listing.reviews.length} review${listing.reviews.length === 1 ? "" : "s"}`
                    : "No approved reviews yet"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Trust summary</dt>
                <dd>{trustSummary.label}</dd>
              </div>
              {hostBadge ? (
                <div>
                  <dt className="font-semibold">Host badge</dt>
                  <dd className="pt-2">
                    <TrustBadge compact {...hostBadge} />
                  </dd>
                </div>
              ) : null}
              {availability.seasonNotes ? (
                <div>
                  <dt className="font-semibold">Season notes</dt>
                  <dd>{availability.seasonNotes}</dd>
                </div>
              ) : null}
            </dl>
          </article>
          {session?.user?.role === UserRole.HUNTER ? (
            existingRequest ? (
              <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Your latest request
                </p>
                <p className="mt-3 text-lg text-[var(--forest)]">
                  {getBookingStatusLabel({
                    status: existingRequest.status,
                    governanceModel: listing.governanceModel,
                    coApprovalRequired: listing.coApprovalRequired,
                    valdName: listing.property.vald?.name,
                    representativeConfirmationStatus: listing.representativeConfirmationStatus,
                  })}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {existingRequest.startDate.toLocaleDateString("nb-NO")} to {existingRequest.endDate.toLocaleDateString("nb-NO")}
                </p>
                {getBookingStatusGuidance({
                  status: existingRequest.status,
                  governanceModel: listing.governanceModel,
                  coApprovalRequired: listing.coApprovalRequired,
                  valdName: listing.property.vald?.name,
                  representativeConfirmationStatus: listing.representativeConfirmationStatus,
                }) ? (
                  <p className="mt-3 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
                    {getBookingStatusGuidance({
                      status: existingRequest.status,
                      governanceModel: listing.governanceModel,
                      coApprovalRequired: listing.coApprovalRequired,
                      valdName: listing.property.vald?.name,
                      representativeConfirmationStatus: listing.representativeConfirmationStatus,
                    })}
                  </p>
                ) : null}
                {existingRequest.requestMessage ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{existingRequest.requestMessage}</p>
                ) : null}
                {existingRequest.landownerResponse ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                    Landowner response: {existingRequest.landownerResponse}
                  </p>
                ) : null}
              </article>
            ) : (
              <RequestBookingForm
                listingId={listing.id}
                listingType={listing.type}
                instantBookEnabled={listing.instantBookEnabled}
                cancellationPolicy={listing.cancellationPolicy}
                governanceModel={listing.governanceModel}
                coApprovalRequired={listing.coApprovalRequired}
                governanceNotes={listing.governanceNotes}
                valdName={listing.property.vald?.name ?? null}
                representativeConfirmationStatus={listing.representativeConfirmationStatus}
                quotaSummary={(listing.quota as { summary?: string } | null)?.summary ?? ""}
                availabilitySummary={(listing.quota as { availabilitySummary?: string } | null)?.availabilitySummary ?? ""}
                permitNotes={(listing.quota as { permitNotes?: string } | null)?.permitNotes ?? ""}
                reportingNotes={(listing.quota as { reportingNotes?: string } | null)?.reportingNotes ?? ""}
                reportingResponsibility={(listing.quota as { reportingResponsibility?: string } | null)?.reportingResponsibility ?? ""}
                speciesRestrictions={(listing.rules as { speciesRestrictions?: string } | null)?.speciesRestrictions ?? ""}
                gearRules={(listing.rules as { gearRules?: string } | null)?.gearRules ?? ""}
                bagLimitNotes={(listing.rules as { bagLimitNotes?: string } | null)?.bagLimitNotes ?? ""}
                areaNotes={(listing.rules as { areaNotes?: string } | null)?.areaNotes ?? ""}
                requiresNationalFishingLicense={(listing.rules as { requiresNationalFishingLicense?: boolean } | null)?.requiresNationalFishingLicense ?? false}
              />
            )
          ) : session?.user?.role === UserRole.LANDOWNER ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6 text-sm leading-7 text-[var(--muted)]">
              Landowners cannot request bookings on listings.
            </article>
          ) : (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6 text-sm leading-7 text-[var(--muted)]">
              Sign in as a hunter to request dates on this listing.
            </article>
          )}
          {availability.blockedRanges.length > 0 ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Unavailable dates
              </p>
              <div className="mt-4 space-y-3">
                {availability.blockedRanges.map((range, index) => (
                  <div key={`${range.startDate}-${range.endDate}-${index}`} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                    {new Date(range.startDate).toLocaleDateString("nb-NO")} to {new Date(range.endDate).toLocaleDateString("nb-NO")}
                    {range.label ? ` · ${range.label}` : ""}
                  </div>
                ))}
              </div>
            </article>
          ) : null}
          {listing.type === "FISHING" ? (
            <FishingAreaWarning
              listingId={listing.id}
              areaNotes={(listing.rules as { areaNotes?: string } | null)?.areaNotes ?? ""}
            />
          ) : null}
          {listing.property.isInCwdZone || showsFishingFeeReminder || showsSalmonReportingReminder || showsBigGameReportingReminder ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Compliance and reporting
              </p>
              <div className="mt-4 space-y-4">
                {listing.property.isInCwdZone ? (
                  <div className="rounded-[1.3rem] border border-[#e7d6ae] bg-[#fff8eb] p-4 text-sm leading-7 text-[#6e5630]">
                    <p className="font-semibold text-[var(--forest)]">CWD zone guidance</p>
                    <p className="mt-2">{getComplianceTaskWhy(ComplianceTaskType.CWD_GUIDANCE)}</p>
                    <p className="mt-2">{getComplianceTaskNextStep(ComplianceTaskType.CWD_GUIDANCE)}</p>
                    <div className="mt-3 space-y-1">
                      {listing.property.cwdZone?.name ? <p>Zone: {listing.property.cwdZone.name}</p> : null}
                      {listing.property.cwdZone?.contactName ? <p>Contact: {listing.property.cwdZone.contactName}</p> : null}
                      {listing.property.cwdZone?.contactPhone ? <p>Phone: {listing.property.cwdZone.contactPhone}</p> : null}
                      {listing.property.cwdZone?.contactEmail ? <p>Email: {listing.property.cwdZone.contactEmail}</p> : null}
                      {listing.property.cwdZone?.contactWebsite ? <p>Website: {listing.property.cwdZone.contactWebsite}</p> : null}
                      {listing.property.cwdZone?.samplingInstructions ? (
                        <p>Sampling: {listing.property.cwdZone.samplingInstructions}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {showsFishingFeeReminder ? (
                  <div className="rounded-[1.3rem] border border-[#d8e6dc] bg-[#f4faf6] p-4 text-sm leading-7 text-[#29543a]">
                    <p className="font-semibold text-[var(--forest)]">Fishing fee reminder</p>
                    <p className="mt-2">{getComplianceTaskWhy(ComplianceTaskType.FISHING_FEE_CONFIRMATION)}</p>
                    <p className="mt-2">{getComplianceTaskNextStep(ComplianceTaskType.FISHING_FEE_CONFIRMATION)}</p>
                  </div>
                ) : null}
                {showsSalmonReportingReminder ? (
                  <div className="rounded-[1.3rem] border border-[#d8e6dc] bg-[#f4faf6] p-4 text-sm leading-7 text-[#29543a]">
                    <p className="font-semibold text-[var(--forest)]">Salmon reporting</p>
                    <p className="mt-2">{getComplianceTaskWhy(ComplianceTaskType.SALMON_REPORTING)}</p>
                    <p className="mt-2">{getComplianceTaskNextStep(ComplianceTaskType.SALMON_REPORTING)}</p>
                  </div>
                ) : null}
                {showsBigGameReportingReminder ? (
                  <div className="rounded-[1.3rem] border border-[#d8e6dc] bg-[#f4faf6] p-4 text-sm leading-7 text-[#29543a]">
                    <p className="font-semibold text-[var(--forest)]">Big-game reporting</p>
                    <p className="mt-2">{getComplianceTaskWhy(ComplianceTaskType.HJORTEVILT_REPORTING)}</p>
                    <p className="mt-2">{getComplianceTaskNextStep(ComplianceTaskType.HJORTEVILT_REPORTING)}</p>
                    {listing.property.vald?.name ? (
                      <p className="mt-2">Shared area context: {listing.property.vald.name}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ) : null}
          {nearbyServices.length > 0 ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Nearby services
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Local help that may fit this area or county.
                  </p>
                </div>
                <Link
                  href={`/services?municipality=${encodeURIComponent(listing.property.municipality)}`}
                  className="text-sm font-semibold text-[var(--forest)]"
                >
                  Browse all services
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {nearbyServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug}`}
                    className="rounded-[1.3rem] border border-[var(--border)] bg-[#fbf8f1] px-4 py-4 transition hover:border-[var(--amber)]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-[var(--forest)]">{service.title}</p>
                        <p className="text-sm leading-7 text-[var(--muted)]">
                          {formatServiceCategory(service.category)} · {service.businessName}
                        </p>
                        <p className="text-sm leading-7 text-[var(--muted)]">
                          {service.municipality}, {service.county}
                          {service.distanceKm !== null ? ` · ${service.distanceKm.toFixed(1)} km away` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--forest)]">
                        {service.priceFromNok
                          ? `From NOK ${service.priceFromNok.toLocaleString("nb-NO")}`
                          : "Price on request"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
          <ShareToolkit
            heading="Share this listing"
            description="Send this listing to a friend, hunting partner, or fishing group. The link points straight back to the public listing."
            shareUrl={genericShareUrl}
            nativeTitle={listing.title}
            nativeText={genericShareCaption}
            links={genericShareLinks}
            captionOptions={[
              {
                label: "General share text",
                text: genericShareCaption,
              },
            ]}
          />
          <OfflineSaveLinks
            scope={`listing-${listing.id}`}
            links={[
              { href: `/listings/${slug}`, label: "Listing detail" },
              ...(listing.type === "FISHING"
                ? [{ href: `/listings/${slug}/field`, label: "Fishing field mode" }]
                : []),
              { href: `/api/listings/${listing.id}/area`, label: "Saved area boundary" },
              ...(existingRequest
                ? [{ href: `/dashboard/bookings/${existingRequest.id}`, label: "Your related booking workspace" }]
                : []),
            ]}
          />
          {listing.hunterExperiences.length > 0 ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                What other hunters found useful here
              </p>
              <div className="mt-4 space-y-4">
                {listing.hunterExperiences.map((experience) => (
                  <div
                    key={experience.id}
                    className="rounded-[1.3rem] border border-[var(--border)] bg-[#fbf8f1] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-base font-semibold text-[var(--forest)]">{experience.title}</p>
                      {session?.user ? <ReportButton kind="experience" id={experience.id} /> : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{experience.summary}</p>
                    <div className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                      {experience.areaQualityNotes ? <p><span className="font-semibold text-[var(--foreground)]">Area quality:</span> {experience.areaQualityNotes}</p> : null}
                      {experience.accessNotes ? <p><span className="font-semibold text-[var(--foreground)]">Access:</span> {experience.accessNotes}</p> : null}
                      {experience.localServicesNotes ? <p><span className="font-semibold text-[var(--foreground)]">Local services:</span> {experience.localServicesNotes}</p> : null}
                      {experience.accommodationNotes ? <p><span className="font-semibold text-[var(--foreground)]">Accommodation:</span> {experience.accommodationNotes}</p> : null}
                      {experience.safetyNotes ? <p><span className="font-semibold text-[var(--foreground)]">Safety:</span> {experience.safetyNotes}</p> : null}
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Shared by {experience.hunter.pii?.fullName ?? "Verified hunter"}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
          {listing.reviews.length > 0 ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Hunter reviews
              </p>
              <div className="mt-4 space-y-4">
                {listing.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[1.3rem] border border-[var(--border)] bg-[#fbf8f1] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-[var(--forest)]">{review.title}</p>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{review.rating} / 5</p>
                      </div>
                      {session?.user ? <ReportButton kind="review" id={review.id} /> : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{review.body}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Shared by {review.reviewer.pii?.fullName ?? "Verified hunter"}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Property context
            </p>
            <dl className="mt-3 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <div>
                <dt className="font-semibold">Area</dt>
                <dd>{listing.property.areaHectares} hectares</dd>
              </div>
              <div>
                <dt className="font-semibold">Location</dt>
                <dd>
                  {listing.property.municipality}, {listing.property.county}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Cadastral reference</dt>
                <dd>{listing.property.cadastralRef}</dd>
              </div>
              <div>
                <dt className="font-semibold">Shared hunting area</dt>
                <dd>
                  {listing.property.vald
                    ? `${listing.property.vald.name} · Representative: ${listing.property.vald.representativeName}`
                    : "No vald context published for this listing"}
                </dd>
              </div>
              {listing.property.vald?.bestandsplanName ? (
                <div>
                  <dt className="font-semibold">Bestandsplan</dt>
                  <dd>{listing.property.vald.bestandsplanName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold">CWD awareness</dt>
                <dd>
                  {listing.property.isInCwdZone
                    ? `Property flagged inside ${listing.property.cwdZone?.name ?? "a monitoring zone"}`
                    : "No CWD zone flag stored on this property"}
                </dd>
              </div>
              {listing.governanceNotes ? (
                <div>
                  <dt className="font-semibold">Approval notes</dt>
                  <dd>{listing.governanceNotes}</dd>
                </div>
              ) : null}
              {(listing.quota as { summary?: string } | null)?.summary ? (
                <div>
                  <dt className="font-semibold">Quota summary</dt>
                  <dd>{(listing.quota as { summary?: string }).summary}</dd>
                </div>
              ) : null}
              {(listing.quota as { availabilitySummary?: string } | null)?.availabilitySummary ? (
                <div>
                  <dt className="font-semibold">Quota availability</dt>
                  <dd>{(listing.quota as { availabilitySummary?: string }).availabilitySummary}</dd>
                </div>
              ) : null}
              {(listing.quota as { permitNotes?: string } | null)?.permitNotes ? (
                <div>
                  <dt className="font-semibold">Permit notes</dt>
                  <dd>{(listing.quota as { permitNotes?: string }).permitNotes}</dd>
                </div>
              ) : null}
              {(listing.quota as { reportingNotes?: string } | null)?.reportingNotes ? (
                <div>
                  <dt className="font-semibold">Reporting notes</dt>
                  <dd>{(listing.quota as { reportingNotes?: string }).reportingNotes}</dd>
                </div>
              ) : null}
              {(listing.quota as { reportingResponsibility?: string } | null)?.reportingResponsibility ? (
                <div>
                  <dt className="font-semibold">Reporting responsibility</dt>
                  <dd>{(listing.quota as { reportingResponsibility?: string }).reportingResponsibility}</dd>
                </div>
              ) : null}
              {hostBadge ? (
                <div>
                  <dt className="font-semibold">Host badge</dt>
                  <dd className="pt-2">
                    <TrustBadge compact {...hostBadge} />
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
          {listing.photos.length > 0 ? (
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Photos
              </p>
              <div className="mt-4 grid gap-3">
                {listing.photos.map((photo) => (
                  <div
                    key={photo}
                    className="overflow-hidden rounded-[1.3rem] border border-[var(--border)] bg-[#f5efe4]"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={photo}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 100vw, 30vw"
                        priority={photo === listing.photos[0]}
                      />
                    </div>
                    <div className="px-4 py-3 text-xs leading-5 text-[var(--muted)]">{photo}</div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Route key
            </p>
            <p className="mt-3 break-all text-lg leading-8 text-[var(--foreground)]">{slug}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
