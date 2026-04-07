import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole, UserStatus } from "@prisma/client";
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  localeHeaderName,
  localizePathname,
  stripLocalePrefix,
  type AppLocale,
} from "@/lib/i18n/config";

const dashboardPrefix = "/dashboard";
const propertyPrefix = "/dashboard/properties";
const legacyAdminPrefix = "/dashboard/admin";
const adminPrefix = "/admin";
const authRoutes = ["/auth/login", "/auth/register"];

function detectLocale(request: NextRequest, pathLocale: AppLocale | null) {
  if (pathLocale) {
    return pathLocale;
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;

  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptedLanguages = request.headers
    .get("accept-language")
    ?.split(",")
    .map((entry) => entry.trim().split(";")[0]?.toLowerCase()) ?? [];

  for (const language of acceptedLanguages) {
    const candidate = language?.split("-")[0];
    if (isSupportedLocale(candidate)) {
      return candidate;
    }
  }

  return defaultLocale;
}

function buildLocalizedUrl(request: NextRequest, locale: AppLocale, pathname: string, search = "") {
  return new URL(`${localizePathname(locale, pathname)}${search}`, request.url);
}

function withLocaleHeaders(request: NextRequest, locale: AppLocale) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale: pathLocale, pathname: normalizedPathname } = stripLocalePrefix(pathname);
  const locale = detectLocale(request, pathLocale);
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "heyra-local-auth-secret-change-me",
  });

  const isSignedIn = Boolean(token?.id);
  const role = token?.role as UserRole | undefined;
  const status = token?.status as UserStatus | undefined;

  if (normalizedPathname.startsWith(legacyAdminPrefix)) {
    const redirectedPath = normalizedPathname.replace(legacyAdminPrefix, adminPrefix) || adminPrefix;
    return NextResponse.redirect(buildLocalizedUrl(request, locale, redirectedPath, search));
  }

  if (
    isSignedIn &&
    (status === UserStatus.SUSPENDED || status === UserStatus.DEACTIVATED) &&
    (normalizedPathname.startsWith(dashboardPrefix) || normalizedPathname.startsWith(adminPrefix))
  ) {
    const loginUrl = buildLocalizedUrl(request, locale, "/auth/login");
    loginUrl.searchParams.set("callbackUrl", localizePathname(locale, "/dashboard"));
    return NextResponse.redirect(loginUrl);
  }

  if (authRoutes.includes(normalizedPathname) && isSignedIn) {
    return NextResponse.redirect(buildLocalizedUrl(request, locale, "/dashboard"));
  }

  if ((normalizedPathname.startsWith(dashboardPrefix) || normalizedPathname.startsWith(adminPrefix)) && !isSignedIn) {
    const loginUrl = buildLocalizedUrl(request, locale, "/auth/login");
    loginUrl.searchParams.set("callbackUrl", `${localizePathname(locale, normalizedPathname)}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (normalizedPathname.startsWith(propertyPrefix) && role !== UserRole.LANDOWNER) {
    return NextResponse.redirect(buildLocalizedUrl(request, locale, "/dashboard"));
  }

  if (normalizedPathname.startsWith(adminPrefix) && role !== UserRole.ADMIN) {
    return NextResponse.redirect(buildLocalizedUrl(request, locale, "/dashboard"));
  }

  if (pathLocale) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = normalizedPathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(localeHeaderName, locale);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set(localeCookieName, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  }

  return withLocaleHeaders(request, locale);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest|robots.txt|sitemap.xml).*)"],
};
