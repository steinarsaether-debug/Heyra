import { describe, expect, it, vi } from "vitest";
import { writeAdminAuditLog } from "./admin-audit";

describe("writeAdminAuditLog", () => {
  it("writes a normalized audit log entry", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit_1" });
    const prisma = {
      adminAuditLog: {
        create,
      },
    } as never;

    await writeAdminAuditLog(prisma, {
      actorUserId: "admin_1",
      targetUserId: "user_1",
      action: "user.suspend",
      summary: "Suspended user after repeated disputes",
      payload: {
        reason: "Repeated disputes",
      },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin_1",
        targetUserId: "user_1",
        action: "user.suspend",
        summary: "Suspended user after repeated disputes",
        payload: {
          reason: "Repeated disputes",
        },
      },
    });
  });
});
