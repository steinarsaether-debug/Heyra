import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchParcelContext } from "@/lib/kartverket-parcels";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  try {
    const context = await searchParcelContext({
      municipalityCode: searchParams.get("municipalityCode"),
      gnr: searchParams.get("gnr"),
      bnr: searchParams.get("bnr"),
      festenr: searchParams.get("festenr"),
      snr: searchParams.get("snr"),
      lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : null,
      lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : null,
    });

    return NextResponse.json(context);
  } catch (error) {
    console.error("Parcel search failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Vi klarte ikke å søke i Kartverket-data akkurat nå.",
      },
      { status: 502 },
    );
  }
}
