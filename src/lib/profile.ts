import { UserRole, type User, type UserPii } from "@prisma/client";
import { getUserRoles } from "@/lib/access";

type ProfileRecord = User & {
  pii: UserPii | null;
};

type CompletionField = {
  key: string;
  label: string;
  complete: boolean;
};

export function getProfileCompletion(user: ProfileRecord) {
  const pii = user.pii;
  const roles = getUserRoles(user);

  const fields: CompletionField[] = [
    { key: "fullName", label: "Full name", complete: Boolean(pii?.fullName?.trim()) },
    { key: "address", label: "Address", complete: Boolean(pii?.address?.trim()) },
    { key: "phone", label: "Phone", complete: Boolean(pii?.phone?.trim()) },
    {
      key: "emergencyName",
      label: "Emergency contact name",
      complete: Boolean(pii?.emergencyName?.trim()),
    },
    {
      key: "emergencyPhone",
      label: "Emergency contact phone",
      complete: Boolean(pii?.emergencyPhone?.trim()),
    },
  ];

  if (roles.includes(UserRole.HUNTER)) {
    fields.push({
      key: "hunterNumber",
      label: "Hunter number",
      complete: Boolean(pii?.hunterNumber?.trim()),
    });
  }

  const completed = fields.filter((field) => field.complete).length;
  const percent = Math.round((completed / fields.length) * 100);

  return {
    percent,
    fields,
    completed,
    total: fields.length,
  };
}

export function getRoleGuidance(input: UserRole | UserRole[]) {
  const roles = Array.isArray(input) ? input : [input];

  if (roles.includes(UserRole.ADMIN) && roles.includes(UserRole.LANDOWNER)) {
    return "Du har både admin- og grunneierrolle. Sørg for at kontaktprofilen er komplett, slik at både drift, eiendomsarbeid og revisjonsspor har en tydelig konto å bygge på.";
  }

  if (roles.includes(UserRole.LANDOWNER)) {
    return "Complete your contact details first so property onboarding, contracts, and payout setup have a clean owner profile to build on.";
  }

  if (roles.includes(UserRole.ADMIN)) {
    return "Use this baseline profile so admin audit trails and contact flows have a verified internal account record.";
  }

  return "Complete your core hunter profile first so future qualification, emergency contact, and compliance flows have the right account foundation.";
}
