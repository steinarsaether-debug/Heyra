import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProperties } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { saveListingPhotoUpload, validateImageUpload } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!canManageProperties(session)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });
    }

    if (files.length > 8) {
      return NextResponse.json({ error: "Upload up to 8 images at a time." }, { status: 400 });
    }

    for (const file of files) {
      const validationError = validateImageUpload(file);

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const uploads = [];

    for (const file of files) {
      const upload = await saveListingPhotoUpload({
        file,
        propertyId: property.id,
      });

      uploads.push(upload);
    }

    return NextResponse.json({ ok: true, uploads }, { status: 201 });
  } catch (error) {
    console.error("Listing photo upload failed", error);
    return NextResponse.json(
      { error: "Something went wrong while uploading the photos." },
      { status: 500 },
    );
  }
}
