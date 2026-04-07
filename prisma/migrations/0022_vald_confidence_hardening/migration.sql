CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "ValdVerificationMethod" AS ENUM ('SELF_DECLARED', 'MUNICIPAL_REFERENCE', 'MANUAL_REVIEW', 'EXTERNAL_REGISTRY');

CREATE TYPE "SharedApprovalStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'CONFIRMED');

ALTER TABLE "Property"
ADD COLUMN "geometryConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "rightsConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "governanceConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "boundaryIsApproximate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rightsDifferFromBoundary" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Vald"
ADD COLUMN "localReference" TEXT,
ADD COLUMN "authorityContactName" TEXT,
ADD COLUMN "authorityContactPhone" TEXT,
ADD COLUMN "authorityContactEmail" TEXT,
ADD COLUMN "verificationMethod" "ValdVerificationMethod" NOT NULL DEFAULT 'SELF_DECLARED',
ADD COLUMN "dataConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "representativeConfirmationStatus" "SharedApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "representativeConfirmedAt" TIMESTAMP(3),
ADD COLUMN "representativeConfirmationNotes" TEXT,
ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Listing"
ADD COLUMN "geometryConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "rightsConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "governanceConfidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "boundaryIsApproximate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rightsDifferFromBoundary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "representativeConfirmationStatus" "SharedApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED';
