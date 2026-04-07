CREATE TYPE "ExperienceModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "HunterExperience" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "hunterId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "areaQualityNotes" TEXT,
  "accessNotes" TEXT,
  "localServicesNotes" TEXT,
  "accommodationNotes" TEXT,
  "safetyNotes" TEXT,
  "moderationStatus" "ExperienceModerationStatus" NOT NULL DEFAULT 'PENDING',
  "moderatorNotes" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HunterExperience_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HunterExperience_bookingId_key" ON "HunterExperience"("bookingId");
CREATE INDEX "HunterExperience_listingId_moderationStatus_publishedAt_idx" ON "HunterExperience"("listingId", "moderationStatus", "publishedAt");
CREATE INDEX "HunterExperience_hunterId_moderationStatus_idx" ON "HunterExperience"("hunterId", "moderationStatus");

ALTER TABLE "HunterExperience"
ADD CONSTRAINT "HunterExperience_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HunterExperience"
ADD CONSTRAINT "HunterExperience_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HunterExperience"
ADD CONSTRAINT "HunterExperience_hunterId_fkey"
FOREIGN KEY ("hunterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
