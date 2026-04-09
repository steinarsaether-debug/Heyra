ALTER TABLE "NotificationOutbox"
ADD COLUMN "complianceTaskId" TEXT;

CREATE INDEX "NotificationOutbox_complianceTaskId_template_scheduledFor_idx"
ON "NotificationOutbox"("complianceTaskId", "template", "scheduledFor");

ALTER TABLE "NotificationOutbox"
ADD CONSTRAINT "NotificationOutbox_complianceTaskId_fkey"
FOREIGN KEY ("complianceTaskId") REFERENCES "ComplianceTask"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
