import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DisputeActions } from "@/components/admin/dispute-actions";
import { ExperienceModerationActions } from "@/components/admin/experience-moderation-actions";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { ReviewQueueActions } from "@/components/admin/review-queue-actions";
import { ServiceProviderReviewActions } from "@/components/admin/service-provider-review-actions";
import { ServiceReviewActions } from "@/components/admin/service-review-actions";
import { canReviewListings } from "@/lib/access";
import {
  formatListingGovernanceModel,
  formatListingStatus,
  formatListingType,
  formatPricingModel,
  formatSpecies,
  getBigGameGovernanceReadiness,
  isBigGameListing,
} from "@/lib/listing-view";
import { prisma } from "@/lib/prisma";
import { formatReviewModerationStatus } from "@/lib/review-view";
import { getServiceTrustSummary } from "@/lib/service-trust";
import { formatServiceCategory, formatServiceStatus } from "@/lib/service-view";

export async function AdminReviewsPageContent() {
  const session = await auth();

  if (!canReviewListings(session)) {
    redirect("/dashboard");
  }

  const listings = await prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      property: {
        select: {
          cadastralRef: true,
          municipality: true,
          county: true,
          boundarySource: true,
          boundarySourceLabel: true,
          boundaryImportedAt: true,
          vald: {
            select: {
              name: true,
              representativeName: true,
              representativeConfirmationStatus: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const experiences = await prisma.hunterExperience.findMany({
    where: {
      moderationStatus: {
        in: ["PENDING", "FLAGGED"],
      },
    },
    include: {
      hunter: {
        select: {
          pii: { select: { fullName: true } },
          email: true,
        },
      },
      listing: {
        select: {
          title: true,
          property: { select: { municipality: true, county: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const reviews = await prisma.review.findMany({
    where: {
      moderationStatus: {
        in: ["PENDING", "FLAGGED"],
      },
    },
    include: {
      reviewer: {
        select: {
          pii: { select: { fullName: true } },
          email: true,
        },
      },
      subjectUser: {
        select: {
          pii: { select: { fullName: true } },
          email: true,
        },
      },
      listing: {
        select: {
          title: true,
          property: { select: { municipality: true, county: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const disputes = await prisma.disputeTicket.findMany({
    where: {
      status: { in: ["OPEN", "UNDER_REVIEW"] },
    },
    include: {
      openedByUser: {
        select: {
          pii: { select: { fullName: true } },
          email: true,
        },
      },
      booking: {
        select: {
          id: true,
          listing: {
            select: {
              title: true,
              property: { select: { municipality: true, county: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const services = await prisma.serviceListing.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      providerProfile: {
        select: {
          businessName: true,
          publicContactName: true,
          municipality: true,
          county: true,
          description: true,
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const providerProfiles = await prisma.serviceProviderProfile.findMany({
    where: {
      reviewStatus: { in: ["PENDING", "FLAGGED"] },
    },
    include: {
      services: {
        select: {
          id: true,
          title: true,
          status: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Admingjennomgang
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Gå gjennom annonser og innhold før de blir synlige.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            Dette er den interne arbeidsflaten for publisering, moderering og første kontroll av delte opplevelser.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
            Det er ingen annonser som venter på gjennomgang akkurat nå.
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => {
              const quota = (listing.quota as
                | {
                    summary?: string;
                    availabilitySummary?: string;
                    permitNotes?: string;
                    reportingNotes?: string;
                    reportingResponsibility?: string;
                  }
                | null) ?? {};
              const rules = (listing.rules as { publicRightsOverlayId?: string | null } | null) ?? {};
              const readiness = getBigGameGovernanceReadiness({
                governanceNotes: listing.governanceNotes,
                quota,
                governanceModel: listing.governanceModel,
                hasVald: Boolean(listing.property.vald),
              });
              const checklist = [
                { label: "Styringsnotater er lagt inn", complete: Boolean(listing.governanceNotes?.trim()) },
                {
                  label: "Avvik mellom kart og rettigheter er forklart ved lav tillit",
                  complete:
                    (!listing.boundaryIsApproximate &&
                      !listing.rightsDifferFromBoundary &&
                      listing.geometryConfidence !== "LOW" &&
                      listing.rightsConfidence !== "LOW") ||
                    Boolean(listing.governanceNotes?.trim()),
                },
                {
                  label: "Storviltkvote eller tillatelsesnotat er fylt ut",
                  complete:
                    !isBigGameListing(listing.species) ||
                    Boolean(quota.summary?.trim() || quota.permitNotes?.trim()),
                },
                {
                  label: "Tilgjengelig kvote er forklart",
                  complete: !isBigGameListing(listing.species) || Boolean(quota.availabilitySummary?.trim()),
                },
                {
                  label: "Rapporteringsansvar er avklart",
                  complete:
                    !isBigGameListing(listing.species) || Boolean(quota.reportingResponsibility?.trim()),
                },
                {
                  label: "Vald-styrt annonse brukes når eiendommen ligger i et vald",
                  complete: !listing.property.vald || listing.governanceModel === "VALD_MANAGED",
                },
                {
                  label: "Representantbekreftelse eller manuell prosess er synlig",
                  complete:
                    !listing.property.vald ||
                    listing.representativeConfirmationStatus === "CONFIRMED" ||
                    Boolean(listing.governanceEvidenceNotes?.trim() || listing.municipalityProcessNotes?.trim()),
                },
                {
                  label: "Offentlig kartlag er valgt når rettighetene avviker fra eiendomsgrensen",
                  complete:
                    !listing.rightsDifferFromBoundary || Boolean(rules.publicRightsOverlayId),
                },
                {
                  label: "Eiendomsgrunnlag er tydelig nok til manuell oppfølging",
                  complete:
                    listing.property.boundarySource === "KARTVERKET_IMPORT" ||
                    Boolean(listing.governanceEvidenceNotes?.trim() || listing.municipalityProcessNotes?.trim()),
                },
                { label: "Minst ett bilde er lastet opp", complete: listing.photos.length > 0 },
              ];

              return (
                <article
                  key={listing.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {formatListingStatus(listing.status)}
                      </p>
                      <h2 className="mt-3 text-2xl text-[var(--forest)]">{listing.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {listing.property.cadastralRef} · {listing.property.municipality}, {listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {formatListingType(listing.type)} · {formatSpecies(listing.species)} · {formatPricingModel(listing.pricingModel)} · NOK {listing.priceNok.toLocaleString("nb-NO")}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {formatListingGovernanceModel(listing.governanceModel)}
                        {listing.coApprovalRequired ? " · Medgodkjenning kreves" : ""}
                        {listing.property.vald ? ` · ${listing.property.vald.name}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Tillit: geometri {listing.geometryConfidence.toLowerCase()} · rettigheter {listing.rightsConfidence.toLowerCase()} · styring {listing.governanceConfidence.toLowerCase()}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Eiendomsgrunnlag:{" "}
                        {listing.property.boundarySource === "KARTVERKET_IMPORT"
                          ? `Kartverket-import${listing.property.boundarySourceLabel ? ` · ${listing.property.boundarySourceLabel}` : ""}`
                          : "manuelt tegnet"}
                        {listing.property.boundaryImportedAt
                          ? ` · importert ${new Date(listing.property.boundaryImportedAt).toLocaleDateString("nb-NO")}`
                          : ""}
                      </p>
                      {listing.boundaryIsApproximate || listing.rightsDifferFromBoundary ? (
                        <p className="mt-2 text-sm leading-7 text-[#6e5630]">
                          {[
                            listing.boundaryIsApproximate ? "Grensen er markert som omtrentelig" : null,
                            listing.rightsDifferFromBoundary ? "Rettighetene kan avvike fra kartet" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                      {listing.property.vald ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Representantstatus: {listing.representativeConfirmationStatus.replaceAll("_", " ").toLowerCase()}
                        </p>
                      ) : null}
                      {listing.rightsDifferFromBoundary ? (
                        <p className="mt-2 text-sm leading-7 text-[#6e5630]">
                          {rules.publicRightsOverlayId
                            ? "Annonsen har et valgt offentlig rettighetslag."
                            : "Annonsen mangler valgt offentlig rettighetslag selv om rettighetene avviker fra eiendomsgrensen."}
                        </p>
                      ) : null}
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{listing.description}</p>
                      {listing.governanceNotes ? (
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                          Styringsnotater: {listing.governanceNotes}
                        </p>
                      ) : null}
                      {listing.governanceEvidenceNotes ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Grunnlag for styring: {listing.governanceEvidenceNotes}
                        </p>
                      ) : null}
                      {listing.municipalityProcessNotes ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Notater om kommunal prosess: {listing.municipalityProcessNotes}
                        </p>
                      ) : null}
                      {quota.summary ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Kvotesammendrag: {quota.summary}
                        </p>
                      ) : null}
                      {quota.permitNotes ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Tillatelsesnotater: {quota.permitNotes}
                        </p>
                      ) : null}
                      {quota.availabilitySummary ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Tilgjengelighet: {quota.availabilitySummary}
                        </p>
                      ) : null}
                      {quota.reportingResponsibility ? (
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          Rapporteringsansvar: {quota.reportingResponsibility}
                        </p>
                      ) : null}
                      {!readiness.ready ? (
                        <div className="mt-4 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
                          {readiness.issues.join(" ")}
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]">
                          Slug: {listing.slug}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {checklist.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                          >
                            {item.complete ? "Klar" : "Sjekk"}: {item.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <ReviewQueueActions
                      listingId={listing.id}
                      initialReviewerNotes={listing.reviewerNotes}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="space-y-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Leverandørprofiler
            </p>
            <h2 className="mt-2 text-3xl text-[var(--forest)]">
              Gå gjennom leverandørprofilene som ligger bak tjenestene.
            </h2>
          </div>
          {providerProfiles.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Det er ingen leverandørprofiler som venter på gjennomgang akkurat nå.
            </div>
          ) : (
            <div className="grid gap-4">
              {providerProfiles.map((profile) => (
                <article
                  key={profile.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {profile.reviewStatus.toLowerCase()}
                      </p>
                      <h3 className="mt-3 text-2xl text-[var(--forest)]">{profile.businessName}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {profile.municipality}, {profile.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {getServiceTrustSummary({
                          reviewStatus: profile.reviewStatus,
                          verifiedAt: profile.verifiedAt,
                          yearsExperience: profile.yearsExperience,
                          publishedServices: profile.services.filter((service) => service.status === "PUBLISHED").length,
                        })}
                      </p>
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{profile.description}</p>
                      <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
                        {profile.publicContactName ? <p>Offentlig kontakt: {profile.publicContactName}</p> : null}
                        {profile.phone ? <p>Telefon: {profile.phone}</p> : null}
                        {profile.email ? <p>E-post: {profile.email}</p> : null}
                        {profile.yearsExperience !== null ? <p>Erfaring: {profile.yearsExperience} år</p> : null}
                        {profile.website ? <p>Nettsted: {profile.website}</p> : null}
                        {profile.services.length > 0 ? (
                          <p>Nylige tjenester: {profile.services.map((service) => service.title).join(", ")}</p>
                        ) : (
                          <p>Ingen tjenester er knyttet til profilen ennå.</p>
                        )}
                      </div>
                    </div>
                    <ServiceProviderReviewActions
                      profileId={profile.id}
                      initialModerationNotes={profile.moderationNotes}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Tjenestegjennomgang
            </p>
            <h2 className="mt-2 text-3xl text-[var(--forest)]">
              Gå gjennom nærliggende leverandører før de vises på offentlige annonsesider.
            </h2>
          </div>
          {services.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Det er ingen tjenester som venter på gjennomgang akkurat nå.
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {formatServiceStatus(service.status)}
                      </p>
                      <h3 className="mt-3 text-2xl text-[var(--forest)]">{service.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {formatServiceCategory(service.category)} · {service.providerProfile.businessName}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {service.municipality}, {service.county}
                      </p>
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{service.description}</p>
                      <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
                        {service.providerProfile.publicContactName ? (
                          <p>Offentlig kontakt: {service.providerProfile.publicContactName}</p>
                        ) : null}
                        <p>
                          Leverandørprofilens base: {service.providerProfile.municipality}, {service.providerProfile.county}
                        </p>
                        <p>
                          Lengde på leverandørbeskrivelse: {service.providerProfile.description.trim().length} tegn
                        </p>
                        <p>
                          Pris: {service.priceFromNok ? `Fra kr ${service.priceFromNok.toLocaleString("nb-NO")}` : "Pris på forespørsel"}
                        </p>
                      </div>
                    </div>
                    <ServiceReviewActions
                      serviceId={service.id}
                      initialReviewerNotes={service.reviewerNotes}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Moderering av jegererfaringer
            </p>
            <h2 className="mt-2 text-2xl text-[var(--forest)]">Praktiske erfaringer som venter på godkjenning</h2>
          </div>

          {experiences.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Det er ingen jegererfaringer som venter på moderering akkurat nå.
            </div>
          ) : (
            <div className="grid gap-4">
              {experiences.map((experience) => (
                <article
                  key={experience.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {experience.moderationStatus === "FLAGGED" ? "Flagget for gjennomgang" : "Venter på moderering"}
                      </p>
                      <h2 className="mt-3 text-2xl text-[var(--forest)]">{experience.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {experience.listing.title} · {experience.listing.property.municipality}, {experience.listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Delt av {experience.hunter.pii?.fullName ?? experience.hunter.email}
                      </p>
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{experience.summary}</p>
                      <div className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
                        {experience.areaQualityNotes ? <p><span className="font-semibold text-[var(--foreground)]">Kvalitet på området:</span> {experience.areaQualityNotes}</p> : null}
                        {experience.accessNotes ? <p><span className="font-semibold text-[var(--foreground)]">Adkomst:</span> {experience.accessNotes}</p> : null}
                        {experience.localServicesNotes ? <p><span className="font-semibold text-[var(--foreground)]">Lokale tjenester:</span> {experience.localServicesNotes}</p> : null}
                        {experience.accommodationNotes ? <p><span className="font-semibold text-[var(--foreground)]">Overnatting:</span> {experience.accommodationNotes}</p> : null}
                        {experience.safetyNotes ? <p><span className="font-semibold text-[var(--foreground)]">Sikkerhet:</span> {experience.safetyNotes}</p> : null}
                      </div>
                    </div>
                    <ExperienceModerationActions
                      experienceId={experience.id}
                      initialModeratorNotes={experience.moderatorNotes}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Moderering av anmeldelser
            </p>
            <h2 className="mt-2 text-2xl text-[var(--forest)]">Vurderinger og anmeldelser som venter på moderering</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Det er ingen anmeldelser som venter på moderering akkurat nå.
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {formatReviewModerationStatus(review.moderationStatus)}
                        {review.isFlagged ? " · flagget" : ""}
                      </p>
                      <h2 className="mt-3 text-2xl text-[var(--forest)]">{review.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {review.listing.title} · {review.listing.property.municipality}, {review.listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {review.rating} / 5 · Fra {review.reviewer.pii?.fullName ?? review.reviewer.email} om {review.subjectUser.pii?.fullName ?? review.subjectUser.email}
                      </p>
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{review.body}</p>
                    </div>
                    <ReviewModerationActions
                      reviewId={review.id}
                      initialModeratorNotes={review.moderatorNotes}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Tvister
            </p>
            <h2 className="mt-2 text-2xl text-[var(--forest)]">Bestillingssaker som venter på oppfølging</h2>
          </div>

          {disputes.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              Det er ingen tvistesaker som venter på oppfølging akkurat nå.
            </div>
          ) : (
            <div className="grid gap-4">
              {disputes.map((dispute) => (
                <article
                  key={dispute.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {dispute.status.toLowerCase().replace("_", " ")}
                      </p>
                      <h2 className="mt-3 text-2xl text-[var(--forest)]">{dispute.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {dispute.booking.listing.title} · {dispute.booking.listing.property.municipality}, {dispute.booking.listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Åpnet av {dispute.openedByUser.pii?.fullName ?? dispute.openedByUser.email}
                      </p>
                      <p className="mt-4 text-base leading-7 text-[var(--foreground)]">{dispute.description}</p>
                    </div>

                    <DisputeActions
                      disputeId={dispute.id}
                      initialNotes={dispute.resolutionNotes}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
