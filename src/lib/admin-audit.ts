import type { Prisma, PrismaClient } from "@prisma/client";

type AuditClient = PrismaClient | Prisma.TransactionClient;

export async function writeAdminAuditLog(
  prisma: AuditClient,
  input: {
    actorUserId: string;
    action: string;
    summary: string;
    targetUserId?: string | null;
    payload?: Prisma.InputJsonValue;
  },
) {
  return prisma.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      summary: input.summary,
      payload: input.payload,
    },
  });
}
