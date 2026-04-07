CREATE TYPE "ServiceProviderReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED');

ALTER TABLE "ServiceProviderProfile"
ADD COLUMN "reviewStatus" "ServiceProviderReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "verifiedAt" TIMESTAMP(3);

CREATE INDEX "ServiceProviderProfile_reviewStatus_county_idx" ON "ServiceProviderProfile"("reviewStatus", "county");
