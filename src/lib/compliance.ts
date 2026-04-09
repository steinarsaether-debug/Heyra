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
      return "Eiendommen overlapper en registrert CWD-sone, så turen kan kreve ekstra prøvetaking eller praktisk oppfølging.";
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return "Noen lakse- og sjøørretvassdrag krever nasjonal fiskeravgift i tillegg til det lokale fiskekortet.";
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return "Storviltjakt i Norge krever ofte rapportering etter turen og tydelige notater om observasjoner og uttak.";
    case ComplianceTaskType.SALMON_REPORTING:
      return "Lakse- og sjøørrettilgang krever ofte tydelig avklaring av fangstrapportering før gjestene kommer.";
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return "Delte storviltområder kan bare tilbys trygt når kvote, tillatelser og hvem som godkjenner tilgang er avklart.";
    default:
      return "Denne oppgaven ble opprettet fra en bestilling eller annonsehendelse som trenger juridisk eller praktisk oppfølging.";
  }
}

export function getComplianceTaskNextStep(taskType: ComplianceTaskType) {
  switch (taskType) {
    case ComplianceTaskType.CWD_GUIDANCE:
      return "Se gjennom soneveiledningen før avreise og ha riktige kontaktpunkter tilgjengelig i felt.";
    case ComplianceTaskType.FISHING_FEE_CONFIRMATION:
      return "Bekreft fiskeravgiften før ankomst og sørg for at dokumentasjon er lett tilgjengelig på lisenssiden.";
    case ComplianceTaskType.HJORTEVILT_REPORTING:
      return "Hold rapporteringsdetaljene klare og åpne Hjorteviltregisteret etter turen dersom rapportering kreves.";
    case ComplianceTaskType.SALMON_REPORTING:
      return "Skriv ned hvem som rapporterer fangst, når det skal gjøres og hvor gjestene finner instruksjonene.";
    case ComplianceTaskType.VALD_QUOTA_REVIEW:
      return "Gå gjennom kvotenotater, styringsspråk og hvem som må bekrefte tilgangen før annonsen skal være aktiv.";
    default:
      return "Åpne den koblede arbeidsflaten og fullfør oppfølgingen.";
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
        title: `CWD-veiledning for ${booking.listing.title}`,
        description: `Denne bestillingen overlapper ${
          booking.listing.property.cwdZone?.name ?? "en registrert CWD-sone"
        }. Gå gjennom lokale prøvetakingsinstruksjoner før eller under turen.`,
        actionLabel: "Åpne bestillingsflate",
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
        title: `Bekreft fiskeravgift for ${booking.listing.title}`,
        description:
          "Denne fiskebestillingen kan kreve nasjonal fiskeravgift i tillegg til det lokale fiskekortet. Bekreft dette før ankomst og ha dokumentasjonen klar ved vannet.",
        actionLabel: "Åpne lisensvisning",
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
        title: `Forbered hjorteviltrapportering for ${booking.listing.title}`,
        description:
          "Storviltturer krever ofte rapportering i etterkant. Hold notater klare og bruk rapporteringslenken etter turen dersom data må sendes inn.",
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
          ? `Vald-kontekst: ${booking.listing.property.vald.name}. Denne turen bør holde notater klare for kommunal eller vald-relatert oppfølging.`
          : `Område: ${booking.listing.property.municipality}, ${booking.listing.property.county}.`,
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
        title: `Gå gjennom kvote og rapportering for ${listing.title}`,
        description:
          "Denne storviltannonsen bør tydelig vise kvote, tillatelser og hvem som bekrefter tilgangen før gjestene kommer.",
        actionLabel: "Åpne annonseflate",
        actionUrl: `/dashboard/properties/${listing.propertyId}/listing`,
        notes: listing.property.vald?.name
          ? `Vald-kontekst: ${listing.property.vald.name}.`
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
        title: `Forbered fangstrapportering for ${listing.title}`,
        description:
          "Hvis denne annonsen brukes som laksevald eller base, må det avklares hvordan fangstrapportering håndteres før gjestene kommer, og instruksjonene må være synlige på annonsen.",
        actionLabel: "Åpne annonseflate",
        actionUrl: `/dashboard/properties/${listing.propertyId}/listing`,
        notes: `Område: ${listing.property.municipality}, ${listing.property.county}. Legg inn praktiske rapporteringsinstruksjoner før gjestene kommer.`,
      }),
    );
  }

  await Promise.all(tasks);
}
