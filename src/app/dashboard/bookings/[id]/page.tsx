import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ContractSignActions } from "@/components/booking/contract-sign-actions";
import { PaymentAuthorizeForm } from "@/components/booking/payment-authorize-form";
import { FieldTripLogger } from "@/components/field/field-trip-logger";
import { FishingAreaWarning } from "@/components/fishing/fishing-area-warning";
import { MobileActionTray } from "@/components/mobile/mobile-action-tray";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { ShareToolkit } from "@/components/share/share-toolkit";
import {
  formatCancellationPolicy,
  formatContractStatus,
  formatPaymentProvider,
  formatPaymentStatus,
  getPaymentProviderOptions,
} from "@/lib/commerce";
import {
  getComplianceTaskNextStep,
  getComplianceTaskWhy,
  isExternalComplianceAction,
} from "@/lib/compliance";
import {
  formatComplianceTaskStatus,
  formatComplianceTaskType,
} from "@/lib/compliance-view";
import { getBookingStatusGuidance, getBookingStatusLabel } from "@/lib/booking-view";
import { prisma } from "@/lib/prisma";
import {
  buildGuestExperienceCaption,
  buildShareLinks,
  buildTrackedShareUrl,
} from "@/lib/share";

export default async function BookingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/bookings");
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      contract: true,
      payment: true,
      invoice: true,
      complianceTasks: {
        where: {
          userId: session.user.id,
        },
        include: {
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
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      },
      listing: {
        include: {
          property: {
            select: {
              ownerId: true,
              municipality: true,
              county: true,
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
                  representativeConfirmationStatus: true,
                },
              },
            },
          },
        },
      },
      hunter: {
        select: {
          email: true,
          pii: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    redirect("/dashboard/bookings");
  }

  const isHunter = booking.hunterId === session.user.id;
  const isOwner = booking.listing.property.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isHunter && !isOwner && !isAdmin) {
    redirect("/dashboard/bookings");
  }

  const guestShareUrl = buildTrackedShareUrl(`/listings/${booking.listing.slug}`, {
    source: booking.listing.type === "FISHING" ? "fisher" : "hunter",
    campaign: "experience-share",
  });
  const guestShareCaption = buildGuestExperienceCaption({
    title: booking.listing.title,
    municipality: booking.listing.property.municipality,
    county: booking.listing.property.county,
  });
  const guestShareLinks = buildShareLinks({
    shareUrl: guestShareUrl,
    title: booking.listing.title,
    caption: guestShareCaption,
  });

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Booking workspace
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              {booking.listing.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              {getBookingStatusLabel({
                status: booking.status,
                governanceModel: booking.listing.governanceModel,
                coApprovalRequired: booking.listing.coApprovalRequired,
                valdName: booking.listing.property.vald?.name,
                representativeConfirmationStatus:
                  booking.listing.property.vald?.representativeConfirmationStatus,
              })}
            </p>
            {getBookingStatusGuidance({
              status: booking.status,
              governanceModel: booking.listing.governanceModel,
              coApprovalRequired: booking.listing.coApprovalRequired,
              valdName: booking.listing.property.vald?.name,
              representativeConfirmationStatus:
                booking.listing.property.vald?.representativeConfirmationStatus,
            }) ? (
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {getBookingStatusGuidance({
                  status: booking.status,
                  governanceModel: booking.listing.governanceModel,
                  coApprovalRequired: booking.listing.coApprovalRequired,
                  valdName: booking.listing.property.vald?.name,
                  representativeConfirmationStatus:
                    booking.listing.property.vald?.representativeConfirmationStatus,
                })}
              </p>
            ) : null}
          </div>

          <Link
            href="/dashboard/bookings"
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            Back to bookings
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Booking status
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{booking.status.toLowerCase().replace("_", " ")}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {booking.startDate.toLocaleDateString("nb-NO")} to {booking.endDate.toLocaleDateString("nb-NO")}
            </p>
            {booking.listing.type === "FISHING" ? (
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                This trip uses the simplified fishing flow, so this workspace can double as your on-the-bank reference page.
              </p>
            ) : null}
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Total
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">NOK {booking.totalNok.toLocaleString("nb-NO")}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Cancellation policy: {formatCancellationPolicy(booking.listing.cancellationPolicy)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Calendar
            </p>
            <a
              href={`/api/listings/${booking.listingId}/calendar.ics`}
              className="mt-3 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
            >
              Export iCal
            </a>
          </article>
        </div>

        {(() => {
          const quota = (booking.listing.quota as {
            summary?: string;
            availabilitySummary?: string;
            permitNotes?: string;
            reportingNotes?: string;
            reportingResponsibility?: string;
          } | null) ?? null;

          if (
            !quota?.summary &&
            !quota?.availabilitySummary &&
            !quota?.permitNotes &&
            !quota?.reportingNotes &&
            !quota?.reportingResponsibility
          ) {
            return null;
          }

          return (
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Quota and governance
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--foreground)] sm:grid-cols-2">
                {quota.summary ? (
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="font-semibold">Quota summary</p>
                    <p className="mt-1 text-[var(--muted)]">{quota.summary}</p>
                  </div>
                ) : null}
                {quota.availabilitySummary ? (
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="font-semibold">Likely availability</p>
                    <p className="mt-1 text-[var(--muted)]">{quota.availabilitySummary}</p>
                  </div>
                ) : null}
                {quota.permitNotes ? (
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="font-semibold">Permit notes</p>
                    <p className="mt-1 text-[var(--muted)]">{quota.permitNotes}</p>
                  </div>
                ) : null}
                {quota.reportingResponsibility ? (
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <p className="font-semibold">Reporting responsibility</p>
                    <p className="mt-1 text-[var(--muted)]">{quota.reportingResponsibility}</p>
                  </div>
                ) : null}
                {quota.reportingNotes ? (
                  <div className="rounded-2xl border border-[var(--border)] px-4 py-3 sm:col-span-2">
                    <p className="font-semibold">Reporting notes</p>
                    <p className="mt-1 text-[var(--muted)]">{quota.reportingNotes}</p>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })()}

        <OfflinePageNote
          onlineText="This booking workspace is a good candidate for offline reuse. Open it before travel and the app can keep a cached copy available if coverage drops."
          offlineText="You are offline. This cached booking workspace should still help with contracts, timing, and reference details, but actions that change booking state need the connection to return."
        />
        <OfflineFreshnessNote
          updatedAt={booking.updatedAt.toISOString()}
          label="This booking workspace"
        />

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Contract
            </p>
            <p className="mt-3 text-lg text-[var(--forest)]">
              {booking.contract ? formatContractStatus(booking.contract.status) : "Not created yet"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {booking.contract ? (
                <a
                  href={`/api/bookings/${booking.id}/documents/contract`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                >
                  Open contract
                </a>
              ) : null}
            </div>
            {booking.contract ? (
              <div className="mt-4">
                <ContractSignActions
                  bookingId={booking.id}
                  canSignAsHunter={isHunter || isAdmin}
                  canSignAsLandowner={isOwner || isAdmin}
                  hunterSignedAt={booking.contract.hunterSignedAt?.toISOString() ?? null}
                  landownerSignedAt={booking.contract.landownerSignedAt?.toISOString() ?? null}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The contract will appear here after the booking moves into contract handling.
              </p>
            )}
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Payment and invoice
            </p>
            {booking.payment ? (
              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--foreground)]">
                <p>
                  Provider: <span className="font-semibold">{formatPaymentProvider(booking.payment.provider)}</span>
                </p>
                <p>
                  Status: <span className="font-semibold">{formatPaymentStatus(booking.payment.status)}</span>
                </p>
                <p>
                  Authorized: NOK {booking.payment.authorizedNok.toLocaleString("nb-NO")}
                </p>
                <p>
                  Captured: NOK {booking.payment.capturedNok.toLocaleString("nb-NO")}
                </p>
                <p>
                  Refunded: NOK {booking.payment.refundedNok.toLocaleString("nb-NO")}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                No payment has been authorized yet.
              </p>
            )}
            {isHunter || isAdmin ? (
              <div className="mt-4">
                <PaymentAuthorizeForm
                  bookingId={booking.id}
                  providers={getPaymentProviderOptions(booking.flowType)}
                />
              </div>
            ) : null}
            {booking.invoice ? (
              <a
                href={`/api/bookings/${booking.id}/documents/invoice`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
              >
                Open invoice
              </a>
            ) : null}
          </article>
        </div>

        <OfflineSaveLinks
          scope={`booking-${booking.id}`}
          links={[
            { href: `/dashboard/bookings/${booking.id}`, label: "Booking workspace" },
            ...(booking.listing.type === "FISHING"
              ? [{ href: `/listings/${booking.listing.slug}/field`, label: "Fishing field mode" }]
              : []),
            ...(booking.listing.type === "FISHING"
              ? [{ href: `/api/listings/${booking.listingId}/area`, label: "Fishing area boundary" }]
              : []),
            { href: `/api/listings/${booking.listingId}/calendar.ics`, label: "Calendar export" },
            ...(booking.contract
              ? [{ href: `/api/bookings/${booking.id}/documents/contract`, label: "Contract document" }]
              : []),
            ...(booking.invoice
              ? [{ href: `/api/bookings/${booking.id}/documents/invoice`, label: "Invoice document" }]
              : []),
          ]}
        />

        {booking.listing.type === "FISHING" ? (
          <div id="field-guidance" className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
                Fishing trip in the field
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  Area: {booking.listing.property.municipality}, {booking.listing.property.county}
                </p>
                {(booking.listing.rules as { areaNotes?: string } | null)?.areaNotes ? (
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Area notes: {(booking.listing.rules as { areaNotes?: string }).areaNotes}
                  </p>
                ) : null}
                {(booking.listing.rules as { gearRules?: string } | null)?.gearRules ? (
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Gear rules: {(booking.listing.rules as { gearRules?: string }).gearRules}
                  </p>
                ) : null}
                {(booking.listing.rules as { bagLimitNotes?: string } | null)?.bagLimitNotes ? (
                  <p className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    Limits: {(booking.listing.rules as { bagLimitNotes?: string }).bagLimitNotes}
                  </p>
                ) : null}
                {(booking.listing.rules as { requiresNationalFishingLicense?: boolean } | null)
                  ?.requiresNationalFishingLicense ? (
                  <p className="rounded-2xl border border-[#d0dfd6] bg-[#eef5f0] px-4 py-3 text-[#29543a]">
                    National fishing licence may also be required before you start fishing.
                  </p>
                ) : null}
                {booking.listing.property.cwdZone ? (
                  <p className="rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-[#6e5630]">
                    CWD overlap recorded on the property: {booking.listing.property.cwdZone.name}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/listings/${booking.listing.slug}/field`}
                  className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open field mode
                </Link>
                <Link
                  href={`/dashboard/bookings/${booking.id}/licence`}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Proof screen
                </Link>
                <Link
                  href={`/listings/${booking.listing.slug}`}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Full listing
                </Link>
              </div>
            </article>

            <FishingAreaWarning
              listingId={booking.listingId}
              areaNotes={(booking.listing.rules as { areaNotes?: string } | null)?.areaNotes ?? ""}
              title="Boundary check"
              description="Use this from the booking workspace while you are moving between pools, banks, or access paths. It helps you confirm that you are still inside the saved licence area."
            />
          </div>
        ) : null}

        {booking.complianceTasks.length > 0 ? (
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              Compliance follow-up
            </p>
            <div className="mt-4 space-y-4">
              {booking.complianceTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[1.3rem] border border-[var(--border)] bg-[#fbf8f1] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                    {formatComplianceTaskType(task.taskType)} · {formatComplianceTaskStatus(task.status)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--forest)]">{task.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{task.description}</p>
                  <div className="mt-3 space-y-2 rounded-2xl border border-[#d8e6dc] bg-[#f4faf6] px-4 py-4 text-sm leading-7 text-[#29543a]">
                    <p>
                      <span className="font-semibold">Why this exists:</span>{" "}
                      {getComplianceTaskWhy(task.taskType)}
                    </p>
                    <p>
                      <span className="font-semibold">Next step:</span>{" "}
                      {getComplianceTaskNextStep(task.taskType)}
                    </p>
                  </div>
                  <div className="mt-3 space-y-1 text-sm leading-7 text-[var(--muted)]">
                    {task.dueAt ? <p>Due: {task.dueAt.toLocaleDateString("nb-NO")}</p> : null}
                    {task.cwdZone?.name ? <p>CWD zone: {task.cwdZone.name}</p> : null}
                    {task.cwdZone?.contactName ? <p>Contact: {task.cwdZone.contactName}</p> : null}
                    {task.cwdZone?.contactPhone ? <p>Phone: {task.cwdZone.contactPhone}</p> : null}
                    {task.cwdZone?.contactEmail ? <p>Email: {task.cwdZone.contactEmail}</p> : null}
                    {task.cwdZone?.contactWebsite ? <p>Website: {task.cwdZone.contactWebsite}</p> : null}
                    {task.cwdZone?.samplingInstructions ? (
                      <p>Sampling: {task.cwdZone.samplingInstructions}</p>
                    ) : null}
                    {task.notes ? <p>{task.notes}</p> : null}
                  </div>
                  {task.actionUrl ? (
                    isExternalComplianceAction(task.actionUrl) ? (
                      <a
                        href={task.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        {task.actionLabel ?? "Open task link"}
                      </a>
                    ) : (
                      <Link
                        href={task.actionUrl}
                        className="mt-4 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        {task.actionLabel ?? "Open task link"}
                      </Link>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <div id="trip-log">
          <FieldTripLogger
            storageKey={`heyra-booking-log:${booking.id}`}
            mode={booking.listing.type === "FISHING" ? "fishing" : "hunting"}
            title={booking.listing.type === "FISHING" ? "Fishing trip log" : "Jaktlogg"}
          />
        </div>

        {isHunter && booking.status === "COMPLETED" ? (
          <ShareToolkit
            heading="Share your trip"
            description="If you had a good experience, this gives you a simple way to tell other hunters or fishers about it on social media and send them back to the public listing."
            shareUrl={guestShareUrl}
            nativeTitle={booking.listing.title}
            nativeText={guestShareCaption}
            links={guestShareLinks}
            captionOptions={[
              {
                label: "General post",
                text: guestShareCaption,
              },
              {
                label: "Short recommendation",
                text: `Worth a look: ${booking.listing.title} on Heyra. ${guestShareUrl}`,
              },
            ]}
          />
        ) : null}

        <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
            Notification outbox
          </p>
          <div className="mt-4 space-y-3">
            {booking.notifications.length === 0 ? (
              <p className="text-sm leading-7 text-[var(--muted)]">No local notifications have been recorded yet.</p>
            ) : (
              booking.notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]">
                  <p className="font-semibold">{notification.subject}</p>
                  <p className="text-[var(--muted)]">{notification.body}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
      <MobileActionTray
        title="Trip actions"
        items={[
          { href: "/dashboard/bookings", label: "Trips" },
          booking.listing.type === "FISHING"
            ? { onClickAnchorId: "field-guidance", label: "Boundary" }
            : { href: `/listings/${booking.listing.slug}`, label: "Listing" },
          { onClickAnchorId: "trip-log", label: "Log" },
          booking.listing.type === "FISHING"
            ? { href: `/dashboard/bookings/${booking.id}/licence`, label: "Proof" }
            : { href: `/listings/${booking.listing.slug}`, label: "Listing" },
        ]}
      />
    </main>
  );
}
