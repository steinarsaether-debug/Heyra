import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { HunterExperienceForm } from "@/components/experience/hunter-experience-form";
import { prisma } from "@/lib/prisma";

export default async function BookingExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/bookings");
  }

  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      hunterId: session.user.id,
    },
    include: {
      hunterExperience: true,
      listing: {
        select: {
          title: true,
          slug: true,
          property: {
            select: {
              municipality: true,
              county: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    redirect("/dashboard/bookings");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Hunter knowledge
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Share practical notes from this trip.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Help the next hunter understand what is useful to know before arriving at {booking.listing.title} in {booking.listing.property.municipality}, {booking.listing.property.county}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/bookings"
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Back to bookings
            </Link>
            <Link
              href={`/listings/${booking.listing.slug}`}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
            >
              View listing
            </Link>
          </div>
        </div>

        <HunterExperienceForm
          bookingId={booking.id}
          listingTitle={booking.listing.title}
          existingExperience={
            booking.hunterExperience
              ? {
                  id: booking.hunterExperience.id,
                  title: booking.hunterExperience.title,
                  summary: booking.hunterExperience.summary,
                  areaQualityNotes: booking.hunterExperience.areaQualityNotes,
                  accessNotes: booking.hunterExperience.accessNotes,
                  localServicesNotes: booking.hunterExperience.localServicesNotes,
                  accommodationNotes: booking.hunterExperience.accommodationNotes,
                  safetyNotes: booking.hunterExperience.safetyNotes,
                  moderationStatus: booking.hunterExperience.moderationStatus,
                  moderatorNotes: booking.hunterExperience.moderatorNotes,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
