CREATE TYPE "ComplianceTaskType" AS ENUM (
  'CWD_GUIDANCE',
  'FISHING_FEE_CONFIRMATION',
  'HJORTEVILT_REPORTING',
  'SALMON_REPORTING',
  'VALD_QUOTA_REVIEW'
);

CREATE TYPE "ComplianceTaskStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'DISMISSED'
);

CREATE TABLE "ComplianceTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingId" TEXT,
  "listingId" TEXT,
  "cwdZoneId" TEXT,
  "assigneeRole" "UserRole" NOT NULL,
  "taskType" "ComplianceTaskType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actionLabel" TEXT,
  "actionUrl" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" "ComplianceTaskStatus" NOT NULL DEFAULT 'OPEN',
  "completedAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComplianceTask_userId_assigneeRole_status_dueAt_idx"
  ON "ComplianceTask"("userId", "assigneeRole", "status", "dueAt");

CREATE INDEX "ComplianceTask_bookingId_taskType_status_idx"
  ON "ComplianceTask"("bookingId", "taskType", "status");

CREATE INDEX "ComplianceTask_listingId_taskType_status_idx"
  ON "ComplianceTask"("listingId", "taskType", "status");

CREATE INDEX "ComplianceTask_cwdZoneId_status_idx"
  ON "ComplianceTask"("cwdZoneId", "status");

ALTER TABLE "ComplianceTask"
  ADD CONSTRAINT "ComplianceTask_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComplianceTask"
  ADD CONSTRAINT "ComplianceTask_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComplianceTask"
  ADD CONSTRAINT "ComplianceTask_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComplianceTask"
  ADD CONSTRAINT "ComplianceTask_cwdZoneId_fkey"
  FOREIGN KEY ("cwdZoneId") REFERENCES "CwdZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
