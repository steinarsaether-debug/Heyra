import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/request";
import { prisma } from "@/lib/prisma";
import { getAverageRating } from "@/lib/review-view";
import { absoluteUrl, getBaseUrl, getSiteDescription, SITE_NAME } from "@/lib/site";
import { getHostQualityBadge, getTrustSummary } from "@/lib/trust-summary";
import "./globals.css";

const heyraSerif = localFont({
  src: [
    {
      path: "./fonts/HeyraSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HeyraSerif-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-heyra-serif",
  display: "swap",
});

const openGraphLocaleByAppLocale = {
  nb: "nb_NO",
  nn: "nn_NO",
  en: "en_US",
  sv: "sv_SE",
  da: "da_DK",
  fi: "fi_FI",
  de: "de_DE",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const siteDescription = getSiteDescription(messages);

  return {
    metadataBase: new URL(getBaseUrl()),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: siteDescription,
    manifest: "/manifest.webmanifest",
    applicationName: SITE_NAME,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      title: SITE_NAME,
      description: siteDescription,
      url: absoluteUrl("/"),
      siteName: SITE_NAME,
      locale: openGraphLocaleByAppLocale[locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: siteDescription,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1b4332",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const session = await auth();
  const userTrust = session?.user
    ? await (async () => {
        const user = await prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
          select: {
            receivedReviews: {
              where: {
                moderationStatus: "APPROVED",
              },
              select: {
                rating: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const averageRating = getAverageRating(user.receivedReviews.map((review) => review.rating));
        const trustSummary = getTrustSummary({
          averageRating,
          reviewCount: user.receivedReviews.length,
        });
        const bookingStats =
          session.user.role === "LANDOWNER"
            ? await prisma.booking.findMany({
                where: {
                  listing: {
                    property: {
                      ownerId: session.user.id,
                    },
                  },
                },
                select: {
                  status: true,
                },
              })
            : [];
        const hostBadge =
          session.user.role === "LANDOWNER"
            ? getHostQualityBadge({
                averageRating,
                approvedReviewCount: user.receivedReviews.length,
                cancelledBookings: bookingStats.filter((booking) => booking.status === "CANCELLED").length,
                totalBookings: bookingStats.length,
              })
            : null;

        return {
          trustSummary: trustSummary.label,
          hostBadge,
        };
      })()
    : null;

  return (
    <html lang={locale}>
      <body className={heyraSerif.variable}>
        <Providers locale={locale} messages={messages}>
          <AppShell locale={locale} messages={messages} session={session} userTrust={userTrust}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
