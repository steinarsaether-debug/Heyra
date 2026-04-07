CREATE TYPE "ListingGovernanceModel" AS ENUM ('INDIVIDUAL_PROPERTY', 'VALD_MANAGED');

CREATE TABLE "Vald" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "representativePhone" TEXT,
    "representativeEmail" TEXT,
    "bestandsplanName" TEXT,
    "coApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vald_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Property"
ADD COLUMN "valdId" TEXT;

ALTER TABLE "Listing"
ADD COLUMN "valdId" TEXT,
ADD COLUMN "governanceModel" "ListingGovernanceModel" NOT NULL DEFAULT 'INDIVIDUAL_PROPERTY',
ADD COLUMN "coApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "governanceNotes" TEXT;

CREATE INDEX "Vald_ownerId_county_idx" ON "Vald"("ownerId", "county");
CREATE INDEX "Property_valdId_idx" ON "Property"("valdId");
CREATE INDEX "Listing_valdId_status_idx" ON "Listing"("valdId", "status");

ALTER TABLE "Vald" ADD CONSTRAINT "Vald_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_valdId_fkey" FOREIGN KEY ("valdId") REFERENCES "Vald"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_valdId_fkey" FOREIGN KEY ("valdId") REFERENCES "Vald"("id") ON DELETE SET NULL ON UPDATE CASCADE;
