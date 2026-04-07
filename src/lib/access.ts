import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";

type Role = UserRole;
type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string;
    role: UserRole;
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

export function canManageProperties(
  session: Session | null,
): session is AuthenticatedSession {
  return hasRole(session, [UserRole.LANDOWNER]);
}

export function canReviewListings(
  session: Session | null,
): session is AuthenticatedSession {
  return hasRole(session, [UserRole.ADMIN]);
}

export function canBrowseDashboard(
  session: Session | null,
): session is AuthenticatedSession {
  return hasRole(session, [UserRole.LANDOWNER, UserRole.HUNTER, UserRole.ADMIN]);
}

export function canManageServices(
  session: Session | null,
): session is AuthenticatedSession {
  return hasRole(session, [UserRole.LANDOWNER, UserRole.HUNTER, UserRole.ADMIN]);
}
