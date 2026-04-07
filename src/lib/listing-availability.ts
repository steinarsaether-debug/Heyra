import { z } from "zod";

const blockedRangeSchema = z.object({
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  label: z.string().trim().max(120, "Label is too long.").optional().default(""),
});

export const listingAvailabilitySchema = z.object({
  seasonNotes: z.string().trim().max(500, "Season notes are too long.").default(""),
  blockedRanges: z.array(blockedRangeSchema).max(20, "Use up to 20 blocked date ranges.").default([]),
});

export type ListingAvailabilityInput = z.infer<typeof listingAvailabilitySchema>;

export function normalizeListingAvailability(input: unknown) {
  const parsed = listingAvailabilitySchema.safeParse(input);

  if (!parsed.success) {
    return {
      seasonNotes: "",
      blockedRanges: [],
    } satisfies ListingAvailabilityInput;
  }

  return parsed.data;
}

export function isDateRangeBlocked(
  availability: ListingAvailabilityInput,
  startDate: Date,
  endDate: Date,
) {
  return availability.blockedRanges.some((range) => {
    const blockedStart = new Date(range.startDate);
    const blockedEnd = new Date(range.endDate);

    if (Number.isNaN(blockedStart.getTime()) || Number.isNaN(blockedEnd.getTime())) {
      return false;
    }

    return blockedStart <= endDate && blockedEnd >= startDate;
  });
}
