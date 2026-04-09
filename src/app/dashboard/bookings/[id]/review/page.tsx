import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { ReviewForm } from "@/components/review/review-form";
import { prisma } from "@/lib/prisma";

export default async function BookingReviewPage({
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
      OR: [
        { hunterId: session.user.id },
        {
          listing: {
            property: {
              ownerId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      listing: {
        include: {
          property: {
            select: {
              ownerId: true,
              municipality: true,
              county: true,
            },
          },
        },
      },
      hunter: {
        select: {
          pii: {
            select: {
              fullName: true,
            },
          },
          email: true,
        },
      },
      reviews: {
        where: {
          reviewerId: session.user.id,
        },
        take: 1,
      },
    },
  });

  if (!booking) {
    notFound();
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    redirect("/dashboard/bookings");
  }

  const isHunterReviewer = booking.hunterId === session.user.id;
  const subjectLabel = isHunterReviewer
    ? `${booking.listing.title} / opplevelsen hos grunneier`
    : `${booking.hunter.pii?.fullName ?? booking.hunter.email} som jeger`;
  const existingReview = booking.reviews[0] ?? null;

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--amber)]">
              Vurdering
            </p>
            <h1 className="mt-3 text-4xl leading-tight text-[var(--forest)] sm:text-5xl">
              Legg igjen en vurdering for denne fullførte bestillingen.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
              Denne vurderingen gjelder {subjectLabel} etter den fullførte turen i {booking.listing.property.municipality}, {booking.listing.property.county}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/bookings"
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            >
              Tilbake til bestillinger
            </Link>
            <Link
              href={`/listings/${booking.listing.slug}`}
              className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
            >
              Se annonse
            </Link>
          </div>
        </div>

        <ReviewForm
          bookingId={booking.id}
          heading={isHunterReviewer ? "Vurder annonsen og grunneieren" : "Vurder jegeren"}
          existingReview={
            existingReview
              ? {
                  id: existingReview.id,
                  rating: existingReview.rating,
                  title: existingReview.title,
                  body: existingReview.body,
                  isFlagged: existingReview.isFlagged,
                  moderationStatus: existingReview.moderationStatus,
                  moderatorNotes: existingReview.moderatorNotes,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
