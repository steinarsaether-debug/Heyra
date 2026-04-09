import { UserRole, UserStatus } from "@prisma/client";
import type { Session } from "next-auth";

type Role = UserRole;
type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: UserRole;
    status: UserStatus;
    fullName: string;
  };
};

export function isSignedIn(session: Session | null): session is AuthenticatedSession {
  return Boolean(session?.user);
}

export function hasRole(session: Session | null, roles: Role[]) {
  if (!session?.user) {
    return false;
  }

  return roles.includes(session.user.role);
}

export function hasAllowedStatus(
  session: Session | null,
  statuses: UserStatus[] = [UserStatus.ACTIVE, UserStatus.PENDING_REVIEW],
) {
  if (!session?.user) {
    return false;
  }

  return statuses.includes(session.user.status);
}

export function canAccessManagedSurfaces(
  session: Session | null,
): session is AuthenticatedSession {
  return isSignedIn(session) && hasAllowedStatus(session);
}

export function hasOperationalAccess(
  session: Session | null,
  statuses: UserStatus[] = [UserStatus.ACTIVE],
) {
  return hasAllowedStatus(session, statuses);
}

export function getOperationalAccessError(
  session: Session | null,
  area: "eiendom" | "tjeneste" | "gjennomgang" = "eiendom",
) {
  if (!session?.user) {
    return "Du må logge inn for å bruke denne arbeidsflaten.";
  }

  if (session.user.status === UserStatus.PENDING_REVIEW) {
    return `Kontoen er til gjennomgang. ${area === "gjennomgang" ? "Interne gjennomgangsflater" : "Operative flater"} er låst til kontoen er godkjent.`;
  }

  if (session.user.status === UserStatus.SUSPENDED) {
    return `Kontoen er suspendert. ${area === "gjennomgang" ? "Gjennomgangsarbeid" : "Operative handlinger"} er sperret til saken er avklart.`;
  }

  if (session.user.status === UserStatus.DEACTIVATED) {
    return "Kontoen er deaktivert og kan ikke bruke denne arbeidsflaten.";
  }

  if (area === "gjennomgang") {
    return "Du har ikke tilgang til denne gjennomgangsflaten.";
  }

  return `Du har ikke tilgang til å administrere ${area === "eiendom" ? "eiendommer" : "tjenester"} her.`;
}

export function canManageProperties(
  session: Session | null,
): session is AuthenticatedSession {
  return isSignedIn(session) && hasOperationalAccess(session) && hasRole(session, [UserRole.LANDOWNER]);
}

export function canReviewListings(
  session: Session | null,
): session is AuthenticatedSession {
  return isSignedIn(session) && hasOperationalAccess(session) && hasRole(session, [UserRole.ADMIN]);
}

export function canBrowseDashboard(
  session: Session | null,
): session is AuthenticatedSession {
  return (
    canAccessManagedSurfaces(session) &&
    hasRole(session, [UserRole.LANDOWNER, UserRole.HUNTER, UserRole.ADMIN])
  );
}

export function canManageServices(
  session: Session | null,
): session is AuthenticatedSession {
  return (
    isSignedIn(session) &&
    hasOperationalAccess(session) &&
    hasRole(session, [UserRole.LANDOWNER, UserRole.HUNTER, UserRole.ADMIN])
  );
}
