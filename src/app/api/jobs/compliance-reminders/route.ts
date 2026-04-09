import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { scheduleComplianceReminders } from "@/lib/compliance-reminders";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization");

  return headerSecret === expectedSecret || bearer === `Bearer ${expectedSecret}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const isAdmin = canReviewListings(session);

  if (!isAdmin && !isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  try {
    const summary = await scheduleComplianceReminders(prisma);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("Compliance reminder job failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kunne ikke kjøre påminnelsesjobben.",
      },
      { status: 500 },
    );
  }
}
