import {
  ComplianceTaskStatus,
  ComplianceTaskType,
  ListingStatus,
  ListingType,
  Prisma,
  PrismaClient,
  Species,
  UserRole,
} from "@prisma/client";

type ComplianceClient = PrismaClient | Prisma.TransactionClient;

const OPEN_TASK_STATUSES: ComplianceTaskStatus[] = [
  ComplianceTaskStatus.OPEN,
  ComplianceTaskStatus.IN_PROGRESS,
];
const BIG_GAME_SPECIES = new Set<Species>([
  Species.ELG,
  Species.HJORT,
  Species.RADYR,
  Species.VILLREIN,
]);
const NATIONAL_FISHING_FEE_SPECIES = new Set<Species>([
  Species.LAKS,
  Species.SJOOERRET,
  Species.ROYE,
]);
const SALMON_REPORTING_SPECIES = new Set<Species>([
  Species.LAKS,
  Species.SJOOERRET,
]);

type CwdContactSource = {
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWebsite: string | null;
  samplingInstructions: string | null;
  metadata?: Prisma.JsonValue | null;
} | null;

export function includesBigGameSpecies(species: Species[]) {
  return species.some((entry) => BIG_GAME_SPECIES.has(entry));
}

export function requiresNationalFishingFee(input: {
  species: Species[];
  rules: Prisma.JsonValue | null;
}) {
  const rules = (input.rules as { requiresNationalFishingLicense?: boolean } | null) ?? {};

  return (
    Boolean(rules.requiresNationalFishingLicense) ||
    input.species.some((entry) => NATIONAL_FISHING_FEE_SPECIES.has(entry))
  );
}

export function buildHjorteviltregisteretDeepLink(input: {
  bookingId: string;
  species: Species[];
  municipality: string;
  county: string;
  valdName?: string | null;
}) {
  const params = new URLSearchParams({
    booking: input.bookingId,
    municipality: input.municipality,
    county: input.county,
    species: input.species.join(","),
  });

  if (input.valdName) {
    params.set("vald", input.valdName);
  }

  return `https://www.hjorteviltregisteret.no/?${params.toString()}`;
}

export function getCwdContactSummary(zone: CwdContactSource) {
  if (!zone) {
    return [];
  }

  const fallbackMetadata =
    (zone.metadata as
      | {
          contactName?: string;
          contactPhone?: string;
          contactEmail?: string;
          contactWebsite?: string;
          samplingInstructions?: string;
        }
      | null) ?? null;

  const contactName = zone.contactName ?? fallbackMetadata?.contactName ?? null;
  const contactPhone = zone.contactPhone ?? fallbackMetadata?.contactPhone ?? null;
  const contactEmail = zone.contactEmail ?? fallbackMetadata?.contactEmail ?? null;
  const contactWebsite = zone.contactWebsite ?? fallbackMetadata?.contactWebsite ?? null;
  const samplingInstructions =
    zone.samplingInstructions ?? fallbackMetadata?.samplingInstructions ?? null;

  const lines = [`Zone: ${zone.name}.`];

  if (contactName) {
    lines.push(`Contact: ${contactName}.`);
  }

  if (contactPhone) {
    lines.push(`Phone: ${contactPhone}.`);
  }

  if (contactEmail) {
    lines.push(`Email: ${contactEmail}.`);
  }

  if (contactWebsite) {
    lines.push(`Website: ${contactWebsite}.`);
  }

  if (samplingInstructions) {
    lines.push(`Sampling: ${samplingInstructions}`);
  }

  return lines;
}

export function getComplianceTaskWhy(taskType: ComplianceTaskType) {
  switch (taskType) {
    case ComplianceTaskType.CWD_GUIDANCE:
      return "The property overlaps a recorded CWD zone, so the trip may need extra sampling or handling follow-up.";
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return "Some salmon and sea-trout waters need a national fee in addition to the local licence.";
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return "Big-game activity in Norway usually requires post-trip reporting and clear harvest notes.";
    case ComplianceTaskType.SALMON_REPORTING:
      return "Salmon and sea-trout access often needs clear catch-reporting responsibility before guests arrive.";
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return "Shared big-game areas can only be sold safely when quota, permits, and who approves access are clear.";
    default:
      return "This task was created from a booking or listing event that needs legal or practical follow-up.";
  }
}

export function getComplianceTaskNextStep(taskType: ComplianceTaskType) {
  switch (taskType) {
    case ComplianceTaskType.CWD_GUIDANCE:
      return "Check the zone guidance before travel and keep the relevant contact details with you in the field.";
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return "Confirm the national fee requirement before arrival and keep proof available on the licence screen.";
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return "Keep harvest details ready and open Hjorteviltregisteret after the trip if reporting is required.";
    case ComplianceTaskType.SALMON_REPORTING:
      return "Write down who reports catches, when they report, and where guests should find those instructions.";
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return "Review quota notes, governance wording, and who must confirm access before the listing stays live.";
    default:
      return "Open the linked workspace and complete the required follow-up.";
  }
}

export function isExternalComplianceAction(actionUrl: string | null | undefined) {
  return Boolean(actionUrl && /^https?:\/\//.test(actionUrl));
}

async function upsertOpenComplianceTask(
  prisma: ComplianceClient,
  input: {
    userId: string;
    bookingId?: string | null;
    listingId?: string | null;
    cwdZoneId?: string | null;
    assigneeRole: UserRole;
    taskType: ComplianceTaskType;
    title: string;
    description: string;
    actionLabel?: string | null;
    actionUrl?: string | null;
    dueAt?: Date | null;
    notes?: string | null;
  },
) {
  const existing = await prisma.complianceTask.findFirst({
    where: {
      userId: input.userId,
      bookingId: input.bookingId ?? null,
      listingId: input.listingId ?? null,
      taskType: input.taskType,
      status: {
        in: [
          ComplianceTaskStatus.OPEN,
          ComplianceTaskStatus.IN_PROGRESS,
          ComplianceTaskStatus.COMPLETED,
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!existing) {
    return prisma.complianceTask.create({
      data: {
        userId: input.userId,
        bookingId: input.bookingId ?? null,
        listingId: input.listingId ?? null,
        cwdZoneId: input.cwdZoneId ?? null,
        assigneeRole: input.assigneeRole,
        taskType: input.taskType,
        title: input.title,
        description: input.description,
        actionLabel: input.actionLabel ?? null,
        actionUrl: input.actionUrl ?? null,
        dueAt: input.dueAt ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  if (existing.status === ComplianceTaskStatus.COMPLETED) {
    return existing;
  }

  return prisma.complianceTask.update({
    where: {
      id: existing.id,
    },
    data: {
      cwdZoneId: input.cwdZoneId ?? null,
      title: input.title,
      description: input.description,
      actionLabel: input.actionLabel ?? null,
      actionUrl: input.actionUrl ?? null,
      dueAt: input.dueAt ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function dismissComplianceTasksForBooking(
  prisma: ComplianceClient,
  bookingId: string,
) {
  return prisma.complianceTask.updateMany({
    where: {
      bookingId,
      status: {
        in: OPEN_TASK_STATUSES,
      },
    },
    data: {
      status: ComplianceTaskStatus.DISMISSED,
      dismissedAt: new Date(),
    },
  });
}

export async function dismissComplianceTasksForListing(
  prisma: ComplianceClient,
  listingId: string,
) {
  return prisma.complianceTask.updateMany({
    where: {
      listingId,
      status: {
        in: OPEN_TASK_STATUSES,
      },
    },
    data: {
      status: ComplianceTaskStatus.DISMISSED,
      dismissedAt: new Date(),
    },
  });
}

export async function syncComplianceTasksForBooking(
  prisma: ComplianceClient,
  bookingId: string,
) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      hunter: {
        select: {
          id: true,
        },
      },
      listing: {
        include: {
          property: {
            select: {
              municipality: true,
              county: true,
              isInCwdZone: true,
              cwdZoneId: true,
              cwdZone: {
                select: {
                  name: true,
                  contactName: true,
                  contactPhone: true,
                  contactEmail: true,
                  contactWebsite: true,
                  samplingInstructions: true,
                  metadata: true,
                },
              },
              ownerId: true,
              vald: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return;
  }

  if (!["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status)) {
    return;
  }

  const tasks: Promise<unknown>[] = [];
  const reportingDueAt = new Date(booking.endDate.getTime() + 1000 * 60 * 60 * 24 * 14);

  if (booking.listing.property.isInCwdZone) {
    tasks.push(
      upsertOpenComplianceTask(prisma, {
        userId: booking.hunter.id,
        bookingId: booking.id,
        listingId: booking.listingId,
        cwdZoneId: booking.listing.property.cwdZoneId,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.CWD_GUIDANCE,
        title: `CWD guidance for ${booking.listing.title}`,
        description: `This booking overlaps ${
          booking.listing.property.cwdZone?.name ?? "a recorded CWD zone"
        }. Check local sampling instructions before or during the trip.`,
        actionLabel: "Open booking workspace",
        actionUrl: `/dashboard/bookings/${booking.id}`,
        dueAt: booking.startDate,
        notes: booking.listing.property.cwdZone
          ? getCwdContactSummary(booking.listing.property.cwdZone).join(" ")
          : null,
      }),
    );
  }

  if (requiresNationalFishingFee({ species: booking.listing.species, rules: booking.listing.rules })) {
    tasks.push(
      upsertOpenComplianceTask(prisma, {
        userId: booking.hunter.id,
        bookingId: booking.id,
        listingId: booking.listingId,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.FISHING_FEE_CONFIRMATION,
        title: `Confirm fishing fee for ${booking.listing.title}`,
        description:
          "This fishing booking may require a national fee in addition to the local licence. Confirm it before arrival and keep proof ready on the riverbank.",
        actionLabel: "Open proof screen",
        actionUrl: `/dashboard/bookings/${booking.id}/licence`,
        dueAt: booking.startDate,
      }),
    );
  }

  if (includesBigGameSpecies(booking.listing.species)) {
    tasks.push(
      upsertOpenComplianceTask(prisma, {
        userId: booking.hunter.id,
        bookingId: booking.id,
        listingId: booking.listingId,
        cwdZoneId: booking.listing.property.cwdZoneId,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.HJORTEVILT_REPORTING,
        title: `Prepare harvest reporting for ${booking.listing.title}`,
        description:
          "Big-game trips need follow-up reporting. Keep notes ready and use the reporting link after the trip if harvest data must be submitted.",
        actionLabel: "Open Hjorteviltregisteret",
        actionUrl: buildHjorteviltregisteretDeepLink({
          bookingId: booking.id,
          species: booking.listing.species,
          municipality: booking.listing.property.municipality,
          county: booking.listing.property.county,
          valdName: booking.listing.property.vald?.name,
        }),
        dueAt: reportingDueAt,
        notes: booking.listing.property.vald?.name
          ? `Shared area context: ${booking.listing.property.vald.name}. This trip should keep harvest notes ready for municipal or vald follow-up.`
          : `Area: ${booking.listing.property.municipality}, ${booking.listing.property.county}.`,
      }),
    );
  }

  await Promise.all(tasks);
}

export async function syncComplianceTasksForListing(
  prisma: ComplianceClient,
  listingId: string,
) {
  const listing = await prisma.listing.findUnique({
    where: {
      id: listingId,
    },
    include: {
      property: {
        select: {
          ownerId: true,
          municipality: true,
          county: true,
          vald: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!listing || listing.status !== ListingStatus.PUBLISHED) {
    return;
  }

  const tasks: Promise<unknown>[] = [];

  if (includesBigGameSpecies(listing.species)) {
    tasks.push(
      upsertOpenComplianceTask(prisma, {
        userId: listing.property.ownerId,
        listingId: listing.id,
        assigneeRole: UserRole.LANDOWNER,
        taskType: ComplianceTaskType.VALD_QUOTA_REVIEW,
        title: `Review quota and reporting for ${listing.title}`,
        description:
          "This big-game listing should clearly reflect quota, permits, and who confirms access before guests arrive.",
        actionLabel: "Open listing workspace",
        actionUrl: `/dashboard/properties/${listing.propertyId}/listing`,
        notes: listing.property.vald?.name
          ? `Vald context: ${listing.property.vald.name}.`
          : `${listing.property.municipality}, ${listing.property.county}.`,
      }),
    );
  }

  if (
    listing.type === ListingType.FISHING &&
    listing.species.some((entry) => SALMON_REPORTING_SPECIES.has(entry))
  ) {
    tasks.push(
      upsertOpenComplianceTask(prisma, {
        userId: listing.property.ownerId,
        listingId: listing.id,
        assigneeRole: UserRole.LANDOWNER,
        taskType: ComplianceTaskType.SALMON_REPORTING,
        title: `Prepare salmon reporting for ${listing.title}`,
        description:
          "If this listing is used as a salmon beat or camp, confirm how season-end catch reporting will be handled before guests arrive and make the instructions visible on the listing.",
        actionLabel: "Open listing workspace",
        actionUrl: `/dashboard/properties/${listing.propertyId}/listing`,
        notes: `Area: ${listing.property.municipality}, ${listing.property.county}. Add practical reporting instructions before guests arrive.`,
      }),
    );
  }

  await Promise.all(tasks);
}
