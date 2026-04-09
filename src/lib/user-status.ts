import { ServiceProviderReviewStatus, UserRole, UserStatus } from "@prisma/client";

export function getPrimaryUserRole(roles: UserRole[]) {
  if (roles.includes(UserRole.LANDOWNER)) {
    return UserRole.LANDOWNER;
  }

  if (roles.includes(UserRole.HUNTER)) {
    return UserRole.HUNTER;
  }

  if (roles.includes(UserRole.ADMIN)) {
    return UserRole.ADMIN;
  }

  return UserRole.HUNTER;
}

export function formatUserRole(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return "Administrator";
    case UserRole.LANDOWNER:
      return "Grunneier";
    case UserRole.HUNTER:
      return "Jeger / fisker";
    default:
      return role;
  }
}

export function formatUserRoles(roles: UserRole[]) {
  const uniqueRoles = Array.from(new Set(roles));
  return uniqueRoles.map((role) => formatUserRole(role)).join(" · ");
}

export function formatUserStatus(status: UserStatus) {
  switch (status) {
    case UserStatus.ACTIVE:
      return "Aktiv";
    case UserStatus.PENDING_REVIEW:
      return "Til gjennomgang";
    case UserStatus.SUSPENDED:
      return "Suspendert";
    case UserStatus.DEACTIVATED:
      return "Deaktivert";
    default:
      return status;
  }
}

export function formatServiceProviderReviewStatus(status: ServiceProviderReviewStatus) {
  switch (status) {
    case ServiceProviderReviewStatus.APPROVED:
      return "Godkjent";
    case ServiceProviderReviewStatus.PENDING:
      return "Til vurdering";
    case ServiceProviderReviewStatus.FLAGGED:
      return "Flagget";
  }
}

export function getUserStatusGuidance(input: {
  status: UserStatus;
  role: UserRole;
  statusReason?: string | null;
}) {
  switch (input.status) {
    case UserStatus.ACTIVE:
      return "Kontoen er aktiv og kan brukes i vanlige arbeidsflyter.";
    case UserStatus.PENDING_REVIEW:
      return input.statusReason
        ? `Kontoen er markert for gjennomgang. Intern merknad: ${input.statusReason}`
        : "Kontoen er markert for gjennomgang. Noen arbeidsflyter kan kreve manuell oppfølging.";
    case UserStatus.SUSPENDED:
      return input.statusReason
        ? `Kontoen er suspendert. Årsak: ${input.statusReason}`
        : "Kontoen er suspendert. Kontakt Heyra dersom dette virker feil.";
    case UserStatus.DEACTIVATED:
      return input.statusReason
        ? `Kontoen er deaktivert. Årsak: ${input.statusReason}`
        : "Kontoen er deaktivert.";
    default:
      return `Kontostatus for ${formatUserRole(input.role).toLowerCase()} er ikke tydelig definert.`;
  }
}

export function getUserStatusEffects(status: UserStatus) {
  switch (status) {
    case UserStatus.ACTIVE:
      return [
        "Du kan bruke vanlige arbeidsflater for eiendom, bestilling og tjenester.",
        "Publisering og oppfølging går som normalt så lenge resten av innholdet er klart.",
      ];
    case UserStatus.PENDING_REVIEW:
      return [
        "Du kan fortsatt se oversikt, konto og historikk.",
        "Operative flater for publisering og styring kan være låst til kontoen er gjennomgått.",
      ];
    case UserStatus.SUSPENDED:
      return [
        "Kontoen er midlertidig stoppet for aktiv bruk.",
        "Publisering, statusendringer og andre operative handlinger er sperret til saken er avklart.",
      ];
    case UserStatus.DEACTIVATED:
      return [
        "Kontoen er slått av for videre bruk.",
        "Du må kontakte Heyra hvis kontoen skal åpnes igjen eller data skal gjennomgås.",
      ];
    default:
      return ["Statusen mangler en tydelig konsekvensbeskrivelse."];
  }
}
