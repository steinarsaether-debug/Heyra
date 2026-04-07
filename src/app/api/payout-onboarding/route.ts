import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const session = await auth();

  if (!session?.user || !hasRole(session, [UserRole.LANDOWNER, UserRole.ADMIN])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      stripeConnectAccountId: session.user.role === "LANDOWNER" ? `sim_connect_${session.user.id.slice(-8)}` : "sim_admin",
    },
    select: {
      stripeConnectAccountId: true,
    },
  });

  return NextResponse.json({ ok: true, accountId: user.stripeConnectAccountId });
}
