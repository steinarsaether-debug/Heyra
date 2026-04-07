import { ServiceCategory } from "@prisma/client";

export const serviceCategoryOptions = [
  ServiceCategory.DOG_HANDLER,
  ServiceCategory.BUTCHER,
  ServiceCategory.ACCOMMODATION,
  ServiceCategory.TRANSPORT,
] as const;

export function parseServiceCategory(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return serviceCategoryOptions.includes(value as (typeof serviceCategoryOptions)[number])
    ? (value as ServiceCategory)
    : null;
}
