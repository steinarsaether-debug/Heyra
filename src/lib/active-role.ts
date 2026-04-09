import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { getPrimaryUserRole } from "@/lib/user-status";

export const activeRoleCookieName = "HEYRA_ACTIVE_ROLE";

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === UserRole.HUNTER || value === UserRole.LANDOWNER || value === UserRole.ADMIN;
}

export function resolveActiveRole(roles: UserRole[], requestedRole?: string | null) {
  if (requestedRole && isUserRole(requestedRole) && roles.includes(requestedRole)) {
    return requestedRole;
  }

  return getPrimaryUserRole(roles);
}

export async function getActiveRoleForUser(roles: UserRole[]) {
  const cookieStore = await cookies();
  return resolveActiveRole(roles, cookieStore.get(activeRoleCookieName)?.value ?? null);
}
