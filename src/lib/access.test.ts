import { describe, expect, it } from "vitest";
import { UserRole, UserStatus } from "@prisma/client";
import {
  canAccessManagedSurfaces,
  canBrowseDashboard,
  canManageProperties,
  canManageServices,
  canReviewListings,
  hasOperationalAccess,
  hasAllowedStatus,
} from "./access";

function buildSession(role: UserRole, status: UserStatus) {
  return {
    user: {
      id: "user_123",
      role,
      status,
      fullName: "Test User",
      email: "test@example.com",
      name: "Test User",
    },
  } as const;
}

describe("access helpers", () => {
  it("allows active and pending-review users onto managed surfaces", () => {
    expect(hasAllowedStatus(buildSession(UserRole.HUNTER, UserStatus.ACTIVE))).toBe(true);
    expect(hasAllowedStatus(buildSession(UserRole.HUNTER, UserStatus.PENDING_REVIEW))).toBe(true);
    expect(canAccessManagedSurfaces(buildSession(UserRole.HUNTER, UserStatus.ACTIVE))).toBe(true);
    expect(canBrowseDashboard(buildSession(UserRole.HUNTER, UserStatus.PENDING_REVIEW))).toBe(true);
  });

  it("requires active status for operational work", () => {
    expect(hasOperationalAccess(buildSession(UserRole.LANDOWNER, UserStatus.ACTIVE))).toBe(true);
    expect(hasOperationalAccess(buildSession(UserRole.LANDOWNER, UserStatus.PENDING_REVIEW))).toBe(false);
  });

  it("blocks suspended and deactivated users from managed surfaces", () => {
    expect(hasAllowedStatus(buildSession(UserRole.HUNTER, UserStatus.SUSPENDED))).toBe(false);
    expect(hasAllowedStatus(buildSession(UserRole.HUNTER, UserStatus.DEACTIVATED))).toBe(false);
    expect(canAccessManagedSurfaces(buildSession(UserRole.HUNTER, UserStatus.SUSPENDED))).toBe(false);
  });

  it("keeps role checks intact on top of status gating", () => {
    expect(canManageProperties(buildSession(UserRole.LANDOWNER, UserStatus.ACTIVE))).toBe(true);
    expect(canManageProperties(buildSession(UserRole.HUNTER, UserStatus.ACTIVE))).toBe(false);

    expect(canReviewListings(buildSession(UserRole.ADMIN, UserStatus.ACTIVE))).toBe(true);
    expect(canReviewListings(buildSession(UserRole.ADMIN, UserStatus.SUSPENDED))).toBe(false);

    expect(canBrowseDashboard(buildSession(UserRole.HUNTER, UserStatus.ACTIVE))).toBe(true);
    expect(canManageServices(buildSession(UserRole.ADMIN, UserStatus.PENDING_REVIEW))).toBe(false);
    expect(canReviewListings(buildSession(UserRole.ADMIN, UserStatus.PENDING_REVIEW))).toBe(false);
  });
});
