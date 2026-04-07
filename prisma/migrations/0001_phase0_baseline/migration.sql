-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- EnableExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LANDOWNER', 'HUNTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING', 'JOINT_CONTROLLER_DPA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TerrainType" AS ENUM ('FOREST', 'MOUNTAIN', 'FJORD', 'WETLAND', 'FARMLAND', 'COASTAL');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('HUNTING', 'FISHING');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('PER_DAY', 'PER_SEASON', 'PER_ANIMAL');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'APPROVED', 'CONTRACT_PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('ELG', 'HJORT', 'RADYR', 'VILLREIN', 'REV', 'RYPE', 'HARE', 'AND', 'LAKS', 'SJOOERRET', 'ROYE', 'OERRET', 'ABBOR', 'GJEDDE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "stripeConnectAccountId" TEXT,
    "vippsSubject" TEXT,
    "bankIdSubject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPii" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "hunterNumber" TEXT,
    "shootingCertRef" TEXT,
    "bankIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "vippsVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPii_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cadastralRef" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "boundary" geometry(Polygon, 4326) NOT NULL,
    "centerPoint" geometry(Point, 4326) NOT NULL,
    "terrainTypes" "TerrainType"[],
    "infrastructure" JSONB NOT NULL,
    "isInCwdZone" BOOLEAN NOT NULL DEFAULT false,
    "cwdZoneId" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "species" "Species"[],
    "quota" JSONB,
    "pricingModel" "PricingModel" NOT NULL,
    "priceNok" DOUBLE PRECISION NOT NULL,
    "maxGroupSize" INTEGER NOT NULL,
    "minNights" INTEGER,
    "availabilityCalendar" JSONB NOT NULL,
    "photos" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "hunterId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "stripePaymentIntentId" TEXT,
    "totalNok" DOUBLE PRECISION NOT NULL,
    "platformFeeNok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payoutNok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_vippsSubject_key" ON "User"("vippsSubject");

-- CreateIndex
CREATE UNIQUE INDEX "User_bankIdSubject_key" ON "User"("bankIdSubject");

-- CreateIndex
CREATE UNIQUE INDEX "UserPii_userId_key" ON "UserPii"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_type_idx" ON "ConsentRecord"("userId", "type");

-- CreateIndex
CREATE INDEX "Property_ownerId_status_idx" ON "Property"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Property_boundary_gist_idx" ON "Property" USING GIST ("boundary");

-- CreateIndex
CREATE INDEX "Property_centerPoint_gist_idx" ON "Property" USING GIST ("centerPoint");

-- CreateIndex
CREATE INDEX "Listing_propertyId_status_idx" ON "Listing"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Booking_listingId_status_idx" ON "Booking"("listingId", "status");

-- CreateIndex
CREATE INDEX "Booking_hunterId_status_idx" ON "Booking"("hunterId", "status");

-- AddForeignKey
ALTER TABLE "UserPii" ADD CONSTRAINT "UserPii_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hunterId_fkey" FOREIGN KEY ("hunterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
