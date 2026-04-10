CREATE TYPE "ParcelSelectionGroupKind" AS ENUM (
  'SAME_PROPERTY',
  'NEARBY'
);

CREATE TABLE "PropertyParcelSelection" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceRef" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "municipalityCode" TEXT,
  "municipalityName" TEXT,
  "gnr" TEXT,
  "bnr" TEXT,
  "festenr" TEXT,
  "snr" TEXT,
  "groupKind" "ParcelSelectionGroupKind" NOT NULL DEFAULT 'SAME_PROPERTY',
  "isIncluded" BOOLEAN NOT NULL DEFAULT false,
  "geometry" geometry(MultiPolygon, 4326) NOT NULL,
  "centerPoint" geometry(Point, 4326),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PropertyParcelSelection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyParcelSelection_propertyId_sourceRef_key"
ON "PropertyParcelSelection"("propertyId", "sourceRef");

CREATE INDEX "PropertyParcelSelection_propertyId_groupKind_isIncluded_idx"
ON "PropertyParcelSelection"("propertyId", "groupKind", "isIncluded");

CREATE INDEX "PropertyParcelSelection_geometry_idx"
ON "PropertyParcelSelection" USING GIST ("geometry");

ALTER TABLE "PropertyParcelSelection"
ADD CONSTRAINT "PropertyParcelSelection_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
