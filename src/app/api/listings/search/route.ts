import { NextResponse } from "next/server";
import { parseListingSearchParams, searchPublishedListings } from "@/lib/listing-search";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseListingSearchParams(searchParams);
    const results = await searchPublishedListings(prisma, params);

    return NextResponse.json({
      ok: true,
      params,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Listing search failed.", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Listing search failed.",
      },
      { status: 500 },
    );
  }
}
