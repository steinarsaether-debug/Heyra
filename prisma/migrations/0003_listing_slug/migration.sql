ALTER TABLE "Listing" ADD COLUMN "slug" TEXT;

UPDATE "Listing"
SET "slug" = LOWER(CONCAT('listing-', "id"))
WHERE "slug" IS NULL;

ALTER TABLE "Listing" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
