import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await (async () => {
    try {
      return await prisma.listing.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } catch (error) {
      console.warn("Sitemap generation fell back to static routes because listings could not be loaded.");
      return [];
    }
  })();
  const services = await (async () => {
    try {
      return await prisma.serviceListing.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } catch (error) {
      console.warn("Sitemap generation fell back to static routes because services could not be loaded.");
      return [];
    }
  })();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/listings"),
      lastModified: listings[0]?.updatedAt ?? new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: services[0]?.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...listings.flatMap((listing) => [
      {
        url: absoluteUrl(`/listings/${listing.slug}`),
        lastModified: listing.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: absoluteUrl(`/listings/${listing.slug}/field`),
        lastModified: listing.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
    ]),
    ...services.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: service.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
