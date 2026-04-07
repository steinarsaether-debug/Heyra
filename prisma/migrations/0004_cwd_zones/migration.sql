CREATE TABLE "CwdZone" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Miljodirektoratet',
    "metadata" JSONB,
    "geometry" geometry(MultiPolygon, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CwdZone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CwdZone_externalId_key" ON "CwdZone"("externalId");
CREATE INDEX "CwdZone_geometry_idx" ON "CwdZone" USING GIST ("geometry");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_cwdZoneId_fkey"
FOREIGN KEY ("cwdZoneId") REFERENCES "CwdZone"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
