CREATE TYPE "BoundarySource" AS ENUM ('MANUAL', 'KARTVERKET_IMPORT');

CREATE TYPE "RightsOverlayType" AS ENUM (
  'HUNTING_AREA',
  'FISHING_ZONE',
  'EXCLUDED_ZONE',
  'ACCESS_ZONE',
  'ENTRY_ZONE'
);

CREATE TYPE "RightsOverlayVisibility" AS ENUM (
  'PRIVATE_DRAFT',
  'INTERNAL_REVIEW',
  'PUBLIC_SIMPLIFIED',
  'BOOKER_ONLY_DETAILED'
);

CREATE TYPE "RightsOverlayProvenance" AS ENUM (
  'MANUAL',
  'KARTVERKET_IMPORT',
  'MUNICIPAL_NOTE',
  'VALD_NOTE',
  'EXTERNAL_DATASET'
);

ALTER TABLE "Property"
ADD COLUMN "boundarySource" "BoundarySource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "boundaryImportedAt" TIMESTAMP(3),
ADD COLUMN "boundarySourceRef" TEXT,
ADD COLUMN "boundarySourceLabel" TEXT;

CREATE TABLE "RightsOverlay" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "listingId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "overlayType" "RightsOverlayType" NOT NULL,
  "visibility" "RightsOverlayVisibility" NOT NULL DEFAULT 'PRIVATE_DRAFT',
  "provenance" "RightsOverlayProvenance" NOT NULL DEFAULT 'MANUAL',
  "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
  "sourceRef" TEXT,
  "sourceLabel" TEXT,
  "geometry" geometry(MultiPolygon, 4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RightsOverlay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RightsOverlay_propertyId_visibility_overlayType_idx" ON "RightsOverlay"("propertyId", "visibility", "overlayType");
CREATE INDEX "RightsOverlay_listingId_visibility_idx" ON "RightsOverlay"("listingId", "visibility");
CREATE INDEX "RightsOverlay_geometry_idx" ON "RightsOverlay" USING GIST ("geometry");

ALTER TABLE "RightsOverlay"
ADD CONSTRAINT "RightsOverlay_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RightsOverlay"
ADD CONSTRAINT "RightsOverlay_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
