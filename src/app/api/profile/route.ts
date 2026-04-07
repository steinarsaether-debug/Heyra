import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { profileSchema } from "@/lib/profile-schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = profileSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid profile payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { fullName, address, phone, emergencyName, emergencyPhone, hunterNumber } =
      parsed.data;

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        pii: {
          upsert: {
            create: {
              fullName,
              address: address || null,
              phone: phone || null,
              emergencyName: emergencyName || null,
              emergencyPhone: emergencyPhone || null,
              hunterNumber: hunterNumber || null,
            },
            update: {
              fullName,
              address: address || null,
              phone: phone || null,
              emergencyName: emergencyName || null,
              emergencyPhone: emergencyPhone || null,
              hunterNumber: hunterNumber || null,
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json(
      { error: "Something went wrong while updating the profile." },
      { status: 500 },
    );
  }
}
