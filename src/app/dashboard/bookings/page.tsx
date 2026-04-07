import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingStatusActions } from "@/components/booking/booking-status-actions";
import { DisputeForm } from "@/components/dispute/dispute-form";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { getBookingStatusGuidance, getBookingStatusLabel } from "@/lib/booking-view";
import { formatDisputeStatus, getDisputeGuidance } from "@/lib/dispute-view";
import { prisma } from "@/lib/prisma";

export default async function DashboardBookingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/bookings");
  }

  const outboundBookings = await prisma.booking.findMany({
    where: {
      hunterId: session.user.id,
    },
    include: {
      hunterExperience: {
        select: {
          id: true,
          moderationStatus: true,
        },
      },
      disputes: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      listing: {
        select: {
          id: true,
          slug: true,
          title: true,
          priceNok: true,
          property: {
            select: {
              cadastralRef: true,
              municipality: true,
              county: true,
              vald: {
                select: {
                  name: true,
                  representativeConfirmationStatus: true,
                },
              },
            },
          },
          governanceModel: true,
          coApprovalRequired: true,
          representativeConfirmationStatus: true,
          governanceNotes: true,
          quota: true,
        },
      },
      hunter: {
        select: {
          email: true,
          pii: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const inboundBookings =
    session.user.role === UserRole.LANDOWNER || session.user.role === UserRole.ADMIN
      ? await prisma.booking.findMany({
          where: {
            listing: {
              property: {
                ownerId: session.user.id,
              },
            },
          },
          include: {
            hunterExperience: {
              select: {
                id: true,
                moderationStatus: true,
              },
            },
            disputes: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            listing: {
              select: {
                id: true,
                slug: true,
                title: true,
                priceNok: true,
                property: {
                  select: {
                    cadastralRef: true,
                    municipality: true,
                    county: true,
                    vald: {
                      select: {
                        name: true,
                        representativeConfirmationStatus: true,
                      },
                    },
                  },
                },
                governanceModel: true,
                coApprovalRequired: true,
                representativeConfirmationStatus: true,
                governanceNotes: true,
                quota: true,
              },
            },
            hunter: {
              select: {
                email: true,
                pii: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];
  const closedStatuses: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.DECLINED,
    BookingStatus.COMPLETED,
  ];
  const allBookings = [...outboundBookings, ...inboundBookings];
  const latestBookingUpdate = allBookings.reduce<Date | null>(
    (latest, booking) => (latest && latest > booking.updatedAt ? latest : booking.updatedAt),
    null,
  );

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Bookings
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Manage requests, approvals, and trip timing.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            This is the first end-to-end booking lane: hunters can send requests, and landowners can approve or decline them from one dashboard.
          </p>
        </div>

        <OfflinePageNote
          onlineText="This bookings overview is worth opening before you travel. It helps keep the current trip picture available if signal drops later."
          offlineText="You are offline. Booking cards shown here come from the latest cached version, so approvals, disputes, and timing may have changed since the last sync."
        />
        {latestBookingUpdate ? (
          <OfflineFreshnessNote
            updatedAt={latestBookingUpdate.toISOString()}
            label="This booking overview"
          />
        ) : null}
        <OfflineSaveLinks
          scope={`bookings-overview-${session.user.id}`}
          links={[
            { href: "/dashboard/bookings", label: "Bookings overview" },
            ...allBookings.slice(0, 6).map((booking) => ({
              href: `/dashboard/bookings/${booking.id}`,
              label: `${booking.listing.title} workspace`,
            })),
          ]}
        />

        {inboundBookings.length > 0 ? (
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Incoming requests
              </p>
              <h2 className="mt-2 text-2xl text-[var(--forest)]">Requests on your listings</h2>
            </div>
            <div className="grid gap-4">
              {inboundBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {getBookingStatusLabel({
                          status: booking.status,
                          governanceModel: booking.listing.governanceModel,
                          coApprovalRequired: booking.listing.coApprovalRequired,
                          valdName: booking.listing.property.vald?.name,
                          representativeConfirmationStatus:
                            booking.listing.representativeConfirmationStatus,
                        })}
                      </p>
                      <h3 className="mt-3 text-2xl text-[var(--forest)]">{booking.listing.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {booking.listing.property.cadastralRef} · {booking.listing.property.municipality}, {booking.listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        Hunter: {booking.hunter.pii?.fullName ?? booking.hunter.email}
                        {booking.hunter.pii?.phone ? ` · ${booking.hunter.pii.phone}` : ""}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                        >
                          Open booking workspace
                        </Link>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {booking.startDate.toLocaleDateString("nb-NO")} to {booking.endDate.toLocaleDateString("nb-NO")} · NOK {booking.totalNok.toLocaleString("nb-NO")}
                      </p>
                      {booking.requestMessage ? (
                        <p className="mt-4 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                          {booking.requestMessage}
                        </p>
                      ) : null}
                      {(() => {
                        const quota = (booking.listing.quota as {
                          summary?: string;
                          availabilitySummary?: string;
                          reportingResponsibility?: string;
                        } | null) ?? null;

                        if (!quota?.summary && !quota?.availabilitySummary && !quota?.reportingResponsibility) {
                          return null;
                        }

                        return (
                          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                            {quota.summary ? <p><span className="font-semibold">Quota:</span> {quota.summary}</p> : null}
                            {quota.availabilitySummary ? <p><span className="font-semibold">Availability:</span> {quota.availabilitySummary}</p> : null}
                            {quota.reportingResponsibility ? <p><span className="font-semibold">Reporting:</span> {quota.reportingResponsibility}</p> : null}
                          </div>
                        );
                      })()}
                      {getBookingStatusGuidance({
                        status: booking.status,
                        governanceModel: booking.listing.governanceModel,
                        coApprovalRequired: booking.listing.coApprovalRequired,
                        valdName: booking.listing.property.vald?.name,
                        representativeConfirmationStatus:
                          booking.listing.representativeConfirmationStatus,
                      }) ? (
                        <p className="mt-4 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
                          {getBookingStatusGuidance({
                            status: booking.status,
                            governanceModel: booking.listing.governanceModel,
                            coApprovalRequired: booking.listing.coApprovalRequired,
                            valdName: booking.listing.property.vald?.name,
                            representativeConfirmationStatus:
                              booking.listing.representativeConfirmationStatus,
                          })}
                        </p>
                      ) : null}
                      {booking.status === BookingStatus.COMPLETED ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/dashboard/bookings/${booking.id}/review`}
                            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                          >
                            Leave review
                          </Link>
                        </div>
                      ) : null}
                      {(booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) ? (
                        <div className="mt-4 space-y-3">
                          {booking.disputes[0] ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                              <p className="font-semibold">
                                Latest dispute: {formatDisputeStatus(booking.disputes[0].status)}
                              </p>
                              <p className="text-[var(--muted)]">
                                {getDisputeGuidance(booking.disputes[0].status)}
                              </p>
                              {booking.disputes[0].resolutionNotes ? (
                                <p className="mt-2 text-[var(--muted)]">
                                  Moderator notes: {booking.disputes[0].resolutionNotes}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          {!booking.disputes[0] ||
                          !["OPEN", "UNDER_REVIEW"].includes(booking.disputes[0].status) ? (
                            <DisputeForm bookingId={booking.id} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.4rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
                      <BookingStatusActions
                        bookingId={booking.id}
                        governanceModel={booking.listing.governanceModel}
                        coApprovalRequired={booking.listing.coApprovalRequired}
                        valdName={booking.listing.property.vald?.name ?? null}
                        allowedActions={
                          booking.status === "REQUESTED"
                            ? ["approve", "decline"]
                            : booking.status === BookingStatus.SHARED_CONFIRMATION_PENDING
                              ? ["confirm_shared", "cancel"]
                            : booking.status === BookingStatus.APPROVED &&
                                booking.endDate <= new Date(new Date().toDateString())
                              ? ["complete", "cancel"]
                              : closedStatuses.includes(booking.status)
                                ? []
                                : ["cancel"]
                        }
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              My requests
            </p>
            <h2 className="mt-2 text-2xl text-[var(--forest)]">Trips you have requested</h2>
          </div>

          {outboundBookings.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              You have not requested any bookings yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {outboundBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                        {getBookingStatusLabel({
                          status: booking.status,
                          governanceModel: booking.listing.governanceModel,
                          coApprovalRequired: booking.listing.coApprovalRequired,
                          valdName: booking.listing.property.vald?.name,
                          representativeConfirmationStatus:
                            booking.listing.representativeConfirmationStatus,
                        })}
                      </p>
                      <h3 className="mt-3 text-2xl text-[var(--forest)]">{booking.listing.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {booking.listing.property.municipality}, {booking.listing.property.county}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {booking.startDate.toLocaleDateString("nb-NO")} to {booking.endDate.toLocaleDateString("nb-NO")} · NOK {booking.totalNok.toLocaleString("nb-NO")}
                      </p>
                      {booking.requestMessage ? (
                        <p className="mt-4 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                          {booking.requestMessage}
                        </p>
                      ) : null}
                      {(() => {
                        const quota = (booking.listing.quota as {
                          summary?: string;
                          availabilitySummary?: string;
                          reportingResponsibility?: string;
                        } | null) ?? null;

                        if (!quota?.summary && !quota?.availabilitySummary && !quota?.reportingResponsibility) {
                          return null;
                        }

                        return (
                          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                            {quota.summary ? <p><span className="font-semibold">Quota:</span> {quota.summary}</p> : null}
                            {quota.availabilitySummary ? <p><span className="font-semibold">Availability:</span> {quota.availabilitySummary}</p> : null}
                            {quota.reportingResponsibility ? <p><span className="font-semibold">Reporting:</span> {quota.reportingResponsibility}</p> : null}
                          </div>
                        );
                      })()}
                      {getBookingStatusGuidance({
                        status: booking.status,
                        governanceModel: booking.listing.governanceModel,
                        coApprovalRequired: booking.listing.coApprovalRequired,
                        valdName: booking.listing.property.vald?.name,
                        representativeConfirmationStatus:
                          booking.listing.representativeConfirmationStatus,
                      }) ? (
                        <p className="mt-4 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
                          {getBookingStatusGuidance({
                            status: booking.status,
                            governanceModel: booking.listing.governanceModel,
                            coApprovalRequired: booking.listing.coApprovalRequired,
                            valdName: booking.listing.property.vald?.name,
                            representativeConfirmationStatus:
                              booking.listing.representativeConfirmationStatus,
                          })}
                        </p>
                      ) : null}
                      {booking.landownerResponse ? (
                        <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                          Landowner response: {booking.landownerResponse}
                        </p>
                      ) : null}
                      {booking.status === BookingStatus.COMPLETED ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/dashboard/bookings/${booking.id}/review`}
                            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                          >
                            Leave review
                          </Link>
                          <Link
                            href={`/dashboard/bookings/${booking.id}/experience`}
                            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                          >
                            {booking.hunterExperience
                              ? "Update practical experience"
                              : "Share practical experience"}
                          </Link>
                          {booking.hunterExperience ? (
                            <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]">
                              Experience {booking.hunterExperience.moderationStatus.toLowerCase()}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {(booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) ? (
                        <div className="mt-4 space-y-3">
                          {booking.disputes[0] ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[#fbf8f1] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                              <p className="font-semibold">
                                Latest dispute: {formatDisputeStatus(booking.disputes[0].status)}
                              </p>
                              <p className="text-[var(--muted)]">
                                {getDisputeGuidance(booking.disputes[0].status)}
                              </p>
                              {booking.disputes[0].resolutionNotes ? (
                                <p className="mt-2 text-[var(--muted)]">
                                  Moderator notes: {booking.disputes[0].resolutionNotes}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          {!booking.disputes[0] ||
                          !["OPEN", "UNDER_REVIEW"].includes(booking.disputes[0].status) ? (
                            <DisputeForm bookingId={booking.id} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.4rem] border border-[var(--border)] bg-[#fbf8f1] p-4">
                      <BookingStatusActions
                        bookingId={booking.id}
                        governanceModel={booking.listing.governanceModel}
                        coApprovalRequired={booking.listing.coApprovalRequired}
                        valdName={booking.listing.property.vald?.name ?? null}
                        allowedActions={
                          booking.status === BookingStatus.APPROVED &&
                          booking.endDate <= new Date(new Date().toDateString())
                            ? ["complete", "cancel"]
                            : closedStatuses.includes(booking.status)
                              ? []
                              : ["cancel"]
                        }
                      />
                    </div>
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
