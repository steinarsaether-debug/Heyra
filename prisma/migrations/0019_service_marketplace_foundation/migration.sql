CREATE TYPE "ServiceCategory" AS ENUM ('DOG_HANDLER', 'BUTCHER', 'ACCOMMODATION', 'TRANSPORT');

CREATE TYPE "ServiceListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "ServiceProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "publicContactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "municipality" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "yearsExperience" INTEGER,
    "qualifications" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "moderationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceListing" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priceFromNok" DOUBLE PRECISION,
    "qualifications" JSONB NOT NULL,
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "ServiceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceProviderProfile_userId_key" ON "ServiceProviderProfile"("userId");
CREATE INDEX "ServiceProviderProfile_county_municipality_idx" ON "ServiceProviderProfile"("county", "municipality");

CREATE UNIQUE INDEX "ServiceListing_slug_key" ON "ServiceListing"("slug");
CREATE INDEX "ServiceListing_providerProfileId_status_idx" ON "ServiceListing"("providerProfileId", "status");
CREATE INDEX "ServiceListing_category_status_county_idx" ON "ServiceListing"("category", "status", "county");

ALTER TABLE "ServiceProviderProfile" ADD CONSTRAINT "ServiceProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ServiceProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
