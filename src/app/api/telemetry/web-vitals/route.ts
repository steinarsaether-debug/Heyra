import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      value?: number;
      rating?: string;
      id?: string;
      pathname?: string;
    };

    console.info("web-vitals", {
      name: body.name ?? "unknown",
      value: body.value ?? 0,
      rating: body.rating ?? "unknown",
      id: body.id ?? "unknown",
      pathname: body.pathname ?? "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("web-vitals ingestion failed", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
