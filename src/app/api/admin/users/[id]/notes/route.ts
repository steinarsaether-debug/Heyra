import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canReviewListings } from "@/lib/access";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";

const noteSchema = z.object({
  body: z.string().trim().min(2, "Skriv litt mer i merknaden.").max(4000),
});

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canReviewListings(session)) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = noteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldig merknad." },
        { status: 400 },
      );
    }

    const note = await prisma.adminUserNote.create({
      data: {
        userId: id,
        adminUserId: session.user.id,
        body: parsed.data.body,
      },
      select: {
        id: true,
      },
    });

    await writeAdminAuditLog(prisma, {
      actorUserId: session.user.id,
      targetUserId: id,
      action: "user.note.created",
      summary: "La til intern merknad på brukeren.",
      payload: {
        noteId: note.id,
      },
    });

    return NextResponse.json({ ok: true, noteId: note.id });
  } catch (error) {
    console.error("Admin user note create failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Kunne ikke lagre intern merknad.",
      },
      { status: 500 },
    );
  }
}
