CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED');

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "reviewerRole" "UserRole" NOT NULL,
  "subjectUserId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isFlagged" BOOLEAN NOT NULL DEFAULT false,
  "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
  "moderatorNotes" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_bookingId_reviewerId_key" ON "Review"("bookingId", "reviewerId");
CREATE INDEX "Review_listingId_moderationStatus_publishedAt_idx" ON "Review"("listingId", "moderationStatus", "publishedAt");
CREATE INDEX "Review_subjectUserId_moderationStatus_publishedAt_idx" ON "Review"("subjectUserId", "moderationStatus", "publishedAt");
CREATE INDEX "Review_reviewerId_moderationStatus_idx" ON "Review"("reviewerId", "moderationStatus");

ALTER TABLE "Review"
ADD CONSTRAINT "Review_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_subjectUserId_fkey"
FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
