import { NotificationChannel, NotificationStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OfflineFreshnessNote } from "@/components/pwa/offline-freshness-note";
import { OfflinePageNote } from "@/components/pwa/offline-page-note";
import { OfflineSaveLinks } from "@/components/pwa/offline-save-links";
import { prisma } from "@/lib/prisma";

function formatNotificationChannel(channel: NotificationChannel) {
  return channel.toLowerCase().replace("_", " ");
}

function formatNotificationStatus(status: NotificationStatus) {
  return status.toLowerCase().replace("_", " ");
}

export default async function DashboardNotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/notifications");
  }

  const notifications = await prisma.notificationOutbox.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      booking: {
        select: {
          id: true,
          listing: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 40,
  });

  const latestNotificationUpdate = notifications[0]?.updatedAt ?? null;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
            Alerts
          </p>
          <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
            Keep track of contracts, payments, and trip updates.
          </h1>
          <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
            This is the first in-app notification center. It mirrors the local outbox so you can still see what the platform tried to tell you, even before external messaging providers are wired in.
          </p>
        </div>

        <OfflinePageNote
          onlineText="This alerts view is worth caching before travel, especially if you want the latest booking and contract messages available in the field."
          offlineText="You are offline. Alerts shown here come from the latest cached version, so newer confirmations or payment updates may not be visible yet."
        />
        {latestNotificationUpdate ? (
          <OfflineFreshnessNote
            updatedAt={latestNotificationUpdate.toISOString()}
            label="This alerts view"
          />
        ) : null}
        <OfflineSaveLinks
          scope={`notifications-${session.user.id}`}
          links={[
            { href: "/dashboard/notifications", label: "Alerts center" },
            ...notifications
              .filter((notification) => notification.bookingId)
              .slice(0, 6)
              .map((notification) => ({
                href: `/dashboard/bookings/${notification.bookingId}`,
                label: `${notification.booking?.listing.title ?? "Booking"} workspace`,
              })),
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Total alerts
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">{notifications.length}</p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Pending
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {notifications.filter((notification) => notification.status === NotificationStatus.PENDING).length}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Sent locally
            </p>
            <p className="mt-3 text-2xl text-[var(--forest)]">
              {notifications.filter((notification) => notification.status === NotificationStatus.SENT).length}
            </p>
          </article>
        </div>

        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6 text-sm leading-7 text-[var(--muted)]">
              No alerts yet. Booking, contract, and payment activity will start to appear here as you use the app.
            </article>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                      {formatNotificationStatus(notification.status)} · {formatNotificationChannel(notification.channel)}
                    </p>
                    <h2 className="mt-3 text-2xl text-[var(--forest)]">{notification.subject}</h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                      {notification.body}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      Created {notification.createdAt.toLocaleString("nb-NO")}
                      {notification.sentAt ? ` · Sent ${notification.sentAt.toLocaleString("nb-NO")}` : ""}
                    </p>
                    {notification.errorMessage ? (
                      <p className="mt-3 rounded-2xl border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630]">
                        {notification.errorMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {notification.booking ? (
                      <Link
                        href={`/dashboard/bookings/${notification.booking.id}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        Open booking
                      </Link>
                    ) : null}
                    {notification.booking?.listing.slug ? (
                      <Link
                        href={`/listings/${notification.booking.listing.slug}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--forest)]"
                      >
                        Open listing
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
