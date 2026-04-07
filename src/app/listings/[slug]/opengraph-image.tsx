import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatListingType, formatSpecies } from "@/lib/listing-view";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      type: true,
      species: true,
      priceNok: true,
      property: {
        select: {
          municipality: true,
          county: true,
        },
      },
    },
  });

  const title = listing?.title ?? "Heyra";
  const subtitle = listing
    ? `${formatListingType(listing.type)} · ${formatSpecies(listing.species)}`
    : "Hunting and fishing in Norway";
  const location = listing
    ? `${listing.property.municipality}, ${listing.property.county}`
    : "Norway";
  const price = listing ? `From NOK ${listing.priceNok.toLocaleString("nb-NO")}` : "Marketplace";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(145deg, #173827 0%, #1b4332 55%, #d97706 140%)",
          color: "#fafaf9",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(250,250,249,0.18)",
            borderRadius: "28px",
            padding: "44px",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Heyra
            </div>
            <div style={{ display: "flex", fontSize: 60, lineHeight: 1.08, fontWeight: 700 }}>
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.88 }}>
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: 28 }}>
              <div style={{ display: "flex", opacity: 0.92 }}>{location}</div>
              <div style={{ display: "flex", opacity: 0.92 }}>{price}</div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 22px",
                borderRadius: "999px",
                background: "rgba(250,250,249,0.12)",
                fontSize: 22,
                opacity: 0.95,
              }}
            >
              Public listing
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
