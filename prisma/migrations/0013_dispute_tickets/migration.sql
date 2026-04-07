CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TABLE "DisputeTicket" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "openedByUserId" TEXT NOT NULL,
  "assignedAdminId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "DisputeTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DisputeTicket_bookingId_status_idx" ON "DisputeTicket"("bookingId", "status");
CREATE INDEX "DisputeTicket_openedByUserId_status_idx" ON "DisputeTicket"("openedByUserId", "status");
CREATE INDEX "DisputeTicket_assignedAdminId_status_idx" ON "DisputeTicket"("assignedAdminId", "status");

ALTER TABLE "DisputeTicket"
ADD CONSTRAINT "DisputeTicket_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DisputeTicket"
ADD CONSTRAINT "DisputeTicket_openedByUserId_fkey"
FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DisputeTicket"
ADD CONSTRAINT "DisputeTicket_assignedAdminId_fkey"
FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
