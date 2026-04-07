import bcrypt from "bcryptjs";
import {
  PrismaClient,
  BookingFlowType,
  BookingStatus,
  CancellationPolicy,
  ComplianceTaskStatus,
  ComplianceTaskType,
  ConfidenceLevel,
  ConsentType,
  ContractStatus,
  DisputeStatus,
  ExperienceModerationStatus,
  ListingGovernanceModel,
  ListingStatus,
  ListingType,
  NotificationChannel,
  NotificationStatus,
  PaymentProvider,
  PaymentStatus,
  PricingModel,
  PropertyStatus,
  ReviewModerationStatus,
  ServiceCategory,
  ServiceListingStatus,
  ServiceProviderReviewStatus,
  SharedApprovalStatus,
  Species,
  TerrainType,
  UserRole,
  UserStatus,
  ValdVerificationMethod,
} from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "HeyraDemo2026!";
const today = new Date();

const demoAccounts = [
  {
    key: "admin",
    email: "admin@heyra.local",
    role: UserRole.ADMIN,
    fullName: "Heyra Admin",
    phone: "+47 900 00 001",
  },
  {
    key: "landowner",
    email: "landowner@heyra.local",
    role: UserRole.LANDOWNER,
    fullName: "Kari Skarslien",
    phone: "+47 900 00 101",
  },
  {
    key: "hunter",
    email: "hunter@heyra.local",
    role: UserRole.HUNTER,
    fullName: "Jonas Fjellheim",
    phone: "+47 900 00 201",
  },
  {
    key: "service",
    email: "service@heyra.local",
    role: UserRole.HUNTER,
    fullName: "Morten Øvregård",
    phone: "+47 900 00 301",
  },
  {
    key: "servicePending",
    email: "service-pending@heyra.local",
    role: UserRole.HUNTER,
    fullName: "Ida Ljosdal",
    phone: "+47 900 00 401",
  },
];

const mode = process.argv.includes("--lite") ? "lite" : "full";
const resetOnly = process.argv.includes("--reset");

function addDays(base, days) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  return value;
}

function squarePolygonWkt(latitude, longitude, delta = 0.03) {
  const points = [
    [longitude - delta, latitude - delta],
    [longitude + delta, latitude - delta],
    [longitude + delta, latitude + delta],
    [longitude - delta, latitude + delta],
    [longitude - delta, latitude - delta],
  ];

  return `POLYGON((${points.map(([lng, lat]) => `${lng} ${lat}`).join(", ")}))`;
}

async function purgeDemoData() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: demoAccounts.map((account) => account.email),
      },
    },
  });

  await prisma.$executeRaw`
    DELETE FROM "CwdZone"
    WHERE "externalId" = 'heyra-demo-nordfjella'
  `;
}

async function setPropertyBoundary(propertyId, latitude, longitude, delta = 0.03) {
  const polygonWkt = squarePolygonWkt(latitude, longitude, delta);

  await prisma.$executeRaw`
    UPDATE "Property"
    SET
      "boundary" = ST_SetSRID(ST_GeomFromText(${polygonWkt}), 4326),
      "centerPoint" = ST_Centroid(ST_SetSRID(ST_GeomFromText(${polygonWkt}), 4326))
    WHERE "id" = ${propertyId}
  `;
}

async function createDemoCwdZone() {
  const geometryWkt = squarePolygonWkt(60.86, 8.55, 0.09);
  const rows = await prisma.$queryRaw`
    INSERT INTO "CwdZone" (
      "id",
      "externalId",
      "name",
      "description",
      "source",
      "contactName",
      "contactPhone",
      "contactEmail",
      "contactWebsite",
      "samplingInstructions",
      "geometry",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid()::text,
      'heyra-demo-nordfjella',
      'Nordfjella demosone',
      'Demosone for testing compliance warnings, manual follow-up, and shared hunting guidance.',
      'Heyra demo',
      'Viltforvaltning Hallingdal',
      '+47 32 00 11 22',
      'cwd-demo@heyra.local',
      'https://example.com/cwd-demo',
      'Ta vare på hode og lymfeknuter ved uttak i sonen og følg lokal prøvetakingsinstruks.',
      ST_Multi(ST_SetSRID(ST_GeomFromText(${geometryWkt}), 4326)),
      NOW(),
      NOW()
    )
    RETURNING "id"
  `;

  return rows[0]?.id;
}

async function createUser(account, passwordHash) {
  const user = await prisma.user.create({
    data: {
      email: account.email,
      role: account.role,
      status: UserStatus.ACTIVE,
      passwordHash,
      emailVerified: today,
      pii: {
        create: {
          fullName: account.fullName,
          phone: account.phone,
          hunterNumber: account.role === UserRole.HUNTER ? `HJ-${account.key.toUpperCase()}-2026` : null,
        },
      },
      notificationPreference: {
        create: {
          marketingUpdates: account.key === "landowner",
        },
      },
      consentRecords: {
        create: [
          {
            type: ConsentType.TERMS_OF_SERVICE,
            version: "2026-04",
            ipAddress: "127.0.0.1",
            grantedAt: today,
          },
          {
            type: ConsentType.PRIVACY_POLICY,
            version: "2026-04",
            ipAddress: "127.0.0.1",
            grantedAt: today,
          },
          {
            type: ConsentType.MARKETING,
            version: "2026-04",
            ipAddress: "127.0.0.1",
            grantedAt: today,
          },
        ],
      },
    },
  });

  return user;
}

async function seedLite(users) {
  const property = await prisma.property.create({
    data: {
      ownerId: users.landowner.id,
      cadastralRef: "117/42",
      municipality: "Flå",
      county: "Buskerud",
      areaHectares: 420,
      terrainTypes: [TerrainType.FOREST, TerrainType.MOUNTAIN],
      infrastructure: {
        hasCabins: true,
        hasBoats: false,
        hasHides: true,
        hasButcheringFacility: true,
      },
      status: PropertyStatus.ACTIVE,
      geometryConfidence: ConfidenceLevel.MEDIUM,
      rightsConfidence: ConfidenceLevel.MEDIUM,
      governanceConfidence: ConfidenceLevel.MEDIUM,
    },
  });

  await setPropertyBoundary(property.id, 60.43, 9.52);

  await prisma.listing.create({
    data: {
      propertyId: property.id,
      slug: "flaa-helgejakt-lite",
      type: ListingType.HUNTING,
      title: "Helgejakt i Flå",
      description:
        "Kort og realistisk demotilbud for lokal testing av navigasjon, bestilling og publisert visning.",
      species: [Species.ELG, Species.HJORT],
      pricingModel: PricingModel.PER_DAY,
      priceNok: 3200,
      maxGroupSize: 3,
      instantBookEnabled: false,
      cancellationPolicy: CancellationPolicy.MODERATE,
      availabilityCalendar: {
        seasonNotes: "Lite demoutvalg med enkel tilgjengelighet.",
        blockedRanges: [],
      },
      quota: {
        summary: "Avklares ved henvendelse.",
        availabilitySummary: "Liten tilgjengelighet i demoperioden.",
        permitNotes: "Valdnotat sendes ved forespørsel.",
        reportingNotes: "Rapportering etter avtale.",
        reportingResponsibility: "Grunneier følger opp.",
      },
      rules: {
        speciesRestrictions: "Kun etter avtale.",
        gearRules: "Bruk godkjent sikkerhetsutstyr.",
        bagLimitNotes: "",
        areaNotes: "Dette er en lettvektsdemo for test.",
        requiresNationalFishingLicense: false,
      },
      photos: ["https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80"],
      status: ListingStatus.PUBLISHED,
      reviewedAt: today,
      governanceModel: ListingGovernanceModel.INDIVIDUAL_PROPERTY,
      governanceNotes: "Lettvektsdemo uten delt styring.",
      geometryConfidence: ConfidenceLevel.MEDIUM,
      rightsConfidence: ConfidenceLevel.MEDIUM,
      governanceConfidence: ConfidenceLevel.MEDIUM,
      coApprovalRequired: false,
    },
  });
}

async function seedFull(users) {
  const cwdZoneId = await createDemoCwdZone();

  const vald = await prisma.vald.create({
    data: {
      ownerId: users.landowner.id,
      name: "Skarslia storviltvald",
      municipality: "Flå",
      county: "Buskerud",
      representativeName: "Kari Skarslien",
      representativePhone: "+47 900 00 101",
      representativeEmail: "landowner@heyra.local",
      localReference: "VALD-FLA-2026-01",
      authorityContactName: "Viltforvaltning Flå",
      authorityContactPhone: "+47 32 05 36 00",
      authorityContactEmail: "post@flaa.kommune.no",
      bestandsplanName: "Skarslia 2026-2028",
      coApprovalRequired: true,
      verificationMethod: ValdVerificationMethod.MANUAL_REVIEW,
      dataConfidence: ConfidenceLevel.MEDIUM,
      representativeConfirmationStatus: SharedApprovalStatus.PENDING,
      representativeConfirmationNotes:
        "Valdansvarlig har gitt muntlig klarsignal, men skriftlig bekreftelse ligger fortsatt i kommunal e-postflyt.",
      notes:
        "Typisk halvformell organisering der notater og lokale avtaler betyr mer enn et fullt digitalt system.",
    },
  });

  const propertyVald = await prisma.property.create({
    data: {
      ownerId: users.landowner.id,
      valdId: vald.id,
      cadastralRef: "117/42",
      municipality: "Flå",
      county: "Buskerud",
      areaHectares: 640,
      terrainTypes: [TerrainType.FOREST, TerrainType.MOUNTAIN],
      infrastructure: {
        hasCabins: true,
        hasBoats: false,
        hasHides: true,
        hasButcheringFacility: true,
      },
      status: PropertyStatus.ACTIVE,
      geometryConfidence: ConfidenceLevel.MEDIUM,
      rightsConfidence: ConfidenceLevel.MEDIUM,
      governanceConfidence: ConfidenceLevel.MEDIUM,
    },
  });

  const propertyLowConfidence = await prisma.property.create({
    data: {
      ownerId: users.landowner.id,
      cadastralRef: "12/8",
      municipality: "Hemsedal",
      county: "Buskerud",
      areaHectares: 310,
      terrainTypes: [TerrainType.MOUNTAIN, TerrainType.WETLAND],
      infrastructure: {
        hasCabins: false,
        hasBoats: false,
        hasHides: false,
        hasButcheringFacility: false,
      },
      status: PropertyStatus.ACTIVE,
      isInCwdZone: true,
      cwdZoneId,
      geometryConfidence: ConfidenceLevel.LOW,
      rightsConfidence: ConfidenceLevel.LOW,
      governanceConfidence: ConfidenceLevel.LOW,
      boundaryIsApproximate: true,
      rightsDifferFromBoundary: true,
    },
  });

  const propertyFishing = await prisma.property.create({
    data: {
      ownerId: users.landowner.id,
      cadastralRef: "4/19",
      municipality: "Sirdal",
      county: "Agder",
      areaHectares: 150,
      terrainTypes: [TerrainType.COASTAL, TerrainType.WETLAND, TerrainType.MOUNTAIN],
      infrastructure: {
        hasCabins: false,
        hasBoats: true,
        hasHides: false,
        hasButcheringFacility: false,
      },
      status: PropertyStatus.ACTIVE,
      geometryConfidence: ConfidenceLevel.HIGH,
      rightsConfidence: ConfidenceLevel.HIGH,
      governanceConfidence: ConfidenceLevel.HIGH,
    },
  });

  await Promise.all([
    setPropertyBoundary(propertyVald.id, 60.43, 9.52, 0.045),
    setPropertyBoundary(propertyLowConfidence.id, 60.86, 8.55, 0.04),
    setPropertyBoundary(propertyFishing.id, 58.92, 6.85, 0.03),
  ]);

  const listingPublishedHunt = await prisma.listing.create({
    data: {
      propertyId: propertyVald.id,
      valdId: vald.id,
      slug: "skarslia-elgjakt-helg",
      type: ListingType.HUNTING,
      title: "Helgejakt på elg i Skarslia vald",
      description:
        "Storviltterreng i skog- og fjellovergang med tydelig møtested, enkel adkomst og erfarne lokale kontakter. Oppsettet er laget for å vise realistisk vald-styring, delvis manuell bekreftelse og tydelige vilkår for gjestejakt.",
      species: [Species.ELG, Species.HJORT],
      pricingModel: PricingModel.PER_DAY,
      priceNok: 4800,
      maxGroupSize: 4,
      minNights: 2,
      instantBookEnabled: false,
      cancellationPolicy: CancellationPolicy.MODERATE,
      availabilityCalendar: {
        seasonNotes: "Best tilgjengelig fra september til november, med noen helger holdt av til lokal jaktlagsturnus.",
        blockedRanges: [
          {
            startDate: addDays(today, 35).toISOString(),
            endDate: addDays(today, 39).toISOString(),
            label: "Lokalt jaktlag",
          },
        ],
      },
      quota: {
        summary: "1 voksen elg eller 1 hjort etter endelig valdavklaring.",
        availabilitySummary: "Ledig for 2-3 helger i høstsesongen.",
        permitNotes: "Valdansvarlig fordeler endelig fellingstillatelse mellom jaktfeltene.",
        reportingNotes: "Felling og observasjoner rapporteres i etterkant av jaktlaget.",
        reportingResponsibility: "Valdansvarlig følger opp rapportering sammen med grunneier.",
      },
      rules: {
        speciesRestrictions: "Kun elg og hjort i henhold til valdets tildeling.",
        gearRules: "Kommunikasjonsradio og synlig varsling ved terrengflytting.",
        bagLimitNotes: "Avklares i endelig jaktmøte.",
        areaNotes: "Bratt skogsterreng med korte forflytninger fra parkeringspunkt.",
        requiresNationalFishingLicense: false,
      },
      photos: [
        "https://images.unsplash.com/photo-1501706362039-c6e13e6f4d3d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
      ],
      status: ListingStatus.PUBLISHED,
      reviewedAt: today,
      governanceModel: ListingGovernanceModel.VALD_MANAGED,
      coApprovalRequired: true,
      representativeConfirmationStatus: SharedApprovalStatus.PENDING,
      governanceNotes:
        "Tilgang avtales først med grunneier, deretter stadfestes endelig helg og kvote mot valdansvarlig representant.",
      governanceEvidenceNotes:
        "Historiske fordelingsnotater og fjorårets jaktoppsett finnes lokalt, men ikke i et offentlig register som er lett å koble til plattformen.",
      municipalityProcessNotes:
        "Kommunal behandling går fortsatt delvis via e-post og vedlegg, så noe oppfølging er manuell.",
      geometryConfidence: ConfidenceLevel.MEDIUM,
      rightsConfidence: ConfidenceLevel.MEDIUM,
      governanceConfidence: ConfidenceLevel.MEDIUM,
    },
  });

  const listingPendingReview = await prisma.listing.create({
    data: {
      propertyId: propertyLowConfidence.id,
      slug: "ulsak-hjortejakt-lia",
      type: ListingType.HUNTING,
      title: "Hjortejakt i lia over Ulsåk",
      description:
        "Foreløpig jaktutkast for en mindre teig med uavklart grensetillit og behov for manuell avklaring mot kommune og naboer. Perfekt for å teste adminflyt, tillitsvarsler og lavt strukturert valdvirkelighet.",
      species: [Species.HJORT, Species.RADYR, Species.RYPE],
      pricingModel: PricingModel.PER_DAY,
      priceNok: 2900,
      maxGroupSize: 3,
      minNights: 2,
      instantBookEnabled: false,
      cancellationPolicy: CancellationPolicy.STRICT,
      availabilityCalendar: {
        seasonNotes: "Utkast med begrenset høstvindu og behov for ekstra manuell avklaring.",
        blockedRanges: [],
      },
      quota: {
        summary: "Hjort etter nærmere dialog med grunneier og kommune.",
        availabilitySummary: "",
        permitNotes: "",
        reportingNotes: "Rapporteringslinje er ikke endelig avklart.",
        reportingResponsibility: "",
      },
      rules: {
        speciesRestrictions: "Må bekreftes før publisering.",
        gearRules: "Må gjennomgås med gjest i forkant.",
        bagLimitNotes: "",
        areaNotes: "Eiendomsgrensen er markert som omtrentelig inntil videre.",
        requiresNationalFishingLicense: false,
      },
      photos: [
        "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
      ],
      status: ListingStatus.PENDING_REVIEW,
      governanceModel: ListingGovernanceModel.INDIVIDUAL_PROPERTY,
      coApprovalRequired: true,
      governanceNotes:
        "Grunneier mener området kan tilbys, men noen rettighetsforhold og kommuneavklaringer må tas manuelt.",
      governanceEvidenceNotes:
        "Muntlig bekreftelse fra lokal kontakt, men ingen samlet digital oversikt over rettighetsbildet.",
      municipalityProcessNotes:
        "Kommunen bruker fortsatt vedlegg og manuell oppfølging i denne typen saker.",
      geometryConfidence: ConfidenceLevel.LOW,
      rightsConfidence: ConfidenceLevel.LOW,
      governanceConfidence: ConfidenceLevel.LOW,
      boundaryIsApproximate: true,
      rightsDifferFromBoundary: true,
      reviewerNotes: "God testkandidat for adminpanelet.",
    },
  });

  const listingDraft = await prisma.listing.create({
    data: {
      propertyId: propertyLowConfidence.id,
      slug: "hemsedal-rypehelg-utkast",
      type: ListingType.HUNTING,
      title: "Rypehelg over tregrensa",
      description:
        "Utkast for kort fjelljakt med enkel overnatting i nærområdet. Brukes som demo for landownerspace, ikke som ferdig publiserbar annonse.",
      species: [Species.RYPE, Species.HARE],
      pricingModel: PricingModel.PER_DAY,
      priceNok: 1900,
      maxGroupSize: 2,
      minNights: 1,
      instantBookEnabled: false,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      availabilityCalendar: {
        seasonNotes: "Enkelt utkast for tidlig sesong.",
        blockedRanges: [],
      },
      quota: {
        summary: "",
        availabilitySummary: "",
        permitNotes: "",
        reportingNotes: "",
        reportingResponsibility: "",
      },
      rules: {
        speciesRestrictions: "Kun småvilt i dette utkastet.",
        gearRules: "Vis hensyn til beitedyr og værforhold.",
        bagLimitNotes: "",
        areaNotes: "",
        requiresNationalFishingLicense: false,
      },
      photos: [
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      ],
      status: ListingStatus.DRAFT,
      governanceModel: ListingGovernanceModel.INDIVIDUAL_PROPERTY,
      coApprovalRequired: false,
      governanceNotes: "Enkeltutkast for intern testing.",
      geometryConfidence: ConfidenceLevel.LOW,
      rightsConfidence: ConfidenceLevel.LOW,
      governanceConfidence: ConfidenceLevel.LOW,
      boundaryIsApproximate: true,
      rightsDifferFromBoundary: true,
    },
  });

  const listingFishing = await prisma.listing.create({
    data: {
      propertyId: propertyFishing.id,
      slug: "suleskard-fluefiske-kveld",
      type: ListingType.FISHING,
      title: "Fluefiske ved Suleskardvatnet",
      description:
        "En mobilvennlig demoflyt for spontankjøp av fiskekort. Inneholder tydelige regler, avgrenset område og oppsett for varsling når du beveger deg ut av sonen.",
      species: [Species.LAKS, Species.OERRET],
      pricingModel: PricingModel.PER_DAY,
      priceNok: 420,
      maxGroupSize: 2,
      minNights: 1,
      instantBookEnabled: true,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      availabilityCalendar: {
        seasonNotes: "Best for kveldsfiske i juni til september.",
        blockedRanges: [
          {
            startDate: addDays(today, 12).toISOString(),
            endDate: addDays(today, 14).toISOString(),
            label: "Vedlikehold av adkomst",
          },
        ],
      },
      quota: {
        summary: "Lokal stangbegrensning gjelder per dag.",
        availabilitySummary: "Åpen for rask kjøpsflyt de fleste dager.",
        permitNotes: "Lokalt fiskekort kjøpes i Heyra.",
        reportingNotes: "Fangstrapport fylles ut etter endt tur.",
        reportingResponsibility: "Gjest rapporterer fangst, grunneier følger opp avvik.",
      },
      rules: {
        speciesRestrictions: "Gjelder laks og ørret i oppført sone.",
        gearRules: "Krok uten mothake anbefales.",
        bagLimitNotes: "Maks to fisk per dag.",
        areaNotes: "Hold deg innenfor elvepartiet som vises i feltvisningen.",
        requiresNationalFishingLicense: true,
      },
      photos: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
      ],
      status: ListingStatus.PUBLISHED,
      reviewedAt: today,
      governanceModel: ListingGovernanceModel.INDIVIDUAL_PROPERTY,
      coApprovalRequired: false,
      governanceNotes: "Fiskekort håndteres direkte av grunneier.",
      geometryConfidence: ConfidenceLevel.HIGH,
      rightsConfidence: ConfidenceLevel.HIGH,
      governanceConfidence: ConfidenceLevel.HIGH,
    },
  });

  const bookingRequested = await prisma.booking.create({
    data: {
      listingId: listingPublishedHunt.id,
      hunterId: users.hunter.id,
      startDate: addDays(today, 18),
      endDate: addDays(today, 20),
      flowType: BookingFlowType.REQUEST,
      requestMessage: "Ønsker å teste den vanlige forespørselsflyten for høstjakt.",
      status: BookingStatus.REQUESTED,
      totalNok: 9600,
      platformFeeNok: 960,
      payoutNok: 8640,
      hunterAttestations: {
        acceptsTerms: true,
        attribution: {
          firstTouchSource: "facebook-group",
          firstTouchCampaign: "community-post",
          lastTouchSource: "landowner",
          lastTouchCampaign: "personal-network",
        },
      },
    },
  });

  const bookingApproved = await prisma.booking.create({
    data: {
      listingId: listingPublishedHunt.id,
      hunterId: users.hunter.id,
      startDate: addDays(today, 28),
      endDate: addDays(today, 30),
      flowType: BookingFlowType.REQUEST,
      requestMessage: "Vil teste en booking som er godkjent, men fortsatt trenger delt avklaring.",
      landownerResponse: "Foreløpig godkjent. Endelig helg bekreftes når valdrepresentant svarer.",
      status: BookingStatus.APPROVED,
      respondedAt: addDays(today, 1),
      totalNok: 9600,
      platformFeeNok: 960,
      payoutNok: 8640,
      hunterAttestations: {
        acceptsTerms: true,
        attribution: {
          firstTouchSource: "repeat-guests",
          firstTouchCampaign: "returning-interest",
          lastTouchSource: "repeat-guests",
          lastTouchCampaign: "returning-interest",
        },
      },
    },
  });

  const bookingFishingConfirmed = await prisma.booking.create({
    data: {
      listingId: listingFishing.id,
      hunterId: users.hunter.id,
      startDate: addDays(today, 6),
      endDate: addDays(today, 6),
      flowType: BookingFlowType.INSTANT_FISHING,
      requestMessage: "Spontankjøp for å teste fiskekortflyt og feltvisning.",
      status: BookingStatus.CONFIRMED,
      confirmedAt: today,
      totalNok: 420,
      platformFeeNok: 42,
      payoutNok: 378,
      hunterAttestations: {
        acceptsTerms: true,
        nationalFishingFeeConfirmed: true,
        attribution: {
          firstTouchSource: "map-search",
          firstTouchCampaign: "nearby-river",
          lastTouchSource: "map-search",
          lastTouchCampaign: "nearby-river",
        },
      },
    },
  });

  const bookingCompletedPublic = await prisma.booking.create({
    data: {
      listingId: listingFishing.id,
      hunterId: users.hunter.id,
      startDate: addDays(today, -18),
      endDate: addDays(today, -17),
      flowType: BookingFlowType.INSTANT_FISHING,
      requestMessage: "Brukes til godkjent anmeldelse og publisert erfaring.",
      landownerResponse: "Alt klart. Området og reglene ligger i feltvisningen.",
      status: BookingStatus.COMPLETED,
      respondedAt: addDays(today, -22),
      confirmedAt: addDays(today, -22),
      completedAt: addDays(today, -17),
      totalNok: 420,
      platformFeeNok: 42,
      payoutNok: 378,
      hunterAttestations: {
        acceptsTerms: true,
        nationalFishingFeeConfirmed: true,
        attribution: {
          firstTouchSource: "facebook-group",
          firstTouchCampaign: "community-post",
          lastTouchSource: "facebook-group",
          lastTouchCampaign: "community-post",
        },
      },
    },
  });

  const bookingCompletedModeration = await prisma.booking.create({
    data: {
      listingId: listingPublishedHunt.id,
      hunterId: users.hunter.id,
      startDate: addDays(today, -34),
      endDate: addDays(today, -32),
      flowType: BookingFlowType.REQUEST,
      requestMessage: "Brukes til flaggede vurderinger og åpen tvist i adminpanelet.",
      landownerResponse: "Gjennomført etter manuell avklaring mot vald.",
      status: BookingStatus.COMPLETED,
      respondedAt: addDays(today, -40),
      confirmedAt: addDays(today, -39),
      completedAt: addDays(today, -32),
      totalNok: 9600,
      platformFeeNok: 960,
      payoutNok: 8640,
      hunterAttestations: {
        acceptsTerms: true,
        attribution: {
          firstTouchSource: "landowner",
          firstTouchCampaign: "personal-network",
          lastTouchSource: "landowner",
          lastTouchCampaign: "personal-network",
        },
      },
    },
  });

  await prisma.contract.createMany({
    data: [
      {
        bookingId: bookingFishingConfirmed.id,
        documentNumber: "HEYRA-CON-1001",
        contentHtml: "<p>Demokontrakt for fiskekort.</p>",
        termsVersion: "2026-04",
        status: ContractStatus.SIGNED,
        generatedAt: addDays(today, -1),
        hunterSignedAt: addDays(today, -1),
        landownerSignedAt: addDays(today, -1),
        lastSentAt: addDays(today, -1),
      },
      {
        bookingId: bookingCompletedPublic.id,
        documentNumber: "HEYRA-CON-1002",
        contentHtml: "<p>Demokontrakt for gjennomført fisketur.</p>",
        termsVersion: "2026-04",
        status: ContractStatus.SIGNED,
        generatedAt: addDays(today, -23),
        hunterSignedAt: addDays(today, -22),
        landownerSignedAt: addDays(today, -22),
        lastSentAt: addDays(today, -22),
      },
    ],
  });

  await prisma.paymentRecord.createMany({
    data: [
      {
        bookingId: bookingFishingConfirmed.id,
        provider: PaymentProvider.VIPPS_SIMULATED,
        status: PaymentStatus.CAPTURED,
        providerReference: "vipps-demo-1001",
        amountNok: 420,
        authorizedNok: 420,
        capturedNok: 420,
        platformFeeNok: 42,
        payoutNok: 378,
        payoutAvailableAt: addDays(today, 7),
        authorizedAt: today,
        capturedAt: today,
      },
      {
        bookingId: bookingCompletedPublic.id,
        provider: PaymentProvider.STRIPE_SIMULATED,
        status: PaymentStatus.CAPTURED,
        providerReference: "stripe-demo-2001",
        amountNok: 420,
        authorizedNok: 420,
        capturedNok: 420,
        platformFeeNok: 42,
        payoutNok: 378,
        payoutAvailableAt: addDays(today, -14),
        payoutReleasedAt: addDays(today, -12),
        authorizedAt: addDays(today, -23),
        capturedAt: addDays(today, -23),
      },
      {
        bookingId: bookingCompletedModeration.id,
        provider: PaymentProvider.MANUAL,
        status: PaymentStatus.CAPTURED,
        providerReference: "manual-demo-3001",
        amountNok: 9600,
        authorizedNok: 9600,
        capturedNok: 9600,
        platformFeeNok: 960,
        payoutNok: 8640,
        payoutAvailableAt: addDays(today, -28),
        payoutReleasedAt: addDays(today, -20),
        authorizedAt: addDays(today, -40),
        capturedAt: addDays(today, -39),
      },
    ],
  });

  await prisma.invoice.createMany({
    data: [
      {
        bookingId: bookingFishingConfirmed.id,
        invoiceNumber: "HEYRA-INV-1001",
        subtotalNok: 336,
        vatRate: 0.25,
        vatNok: 84,
        totalNok: 420,
        contentHtml: "<p>Demofaktura for fiskekort.</p>",
      },
      {
        bookingId: bookingCompletedPublic.id,
        invoiceNumber: "HEYRA-INV-1002",
        subtotalNok: 336,
        vatRate: 0.25,
        vatNok: 84,
        totalNok: 420,
        contentHtml: "<p>Demofaktura for gjennomført fisketur.</p>",
        issuedAt: addDays(today, -23),
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      {
        bookingId: bookingCompletedPublic.id,
        listingId: listingFishing.id,
        reviewerId: users.hunter.id,
        reviewerRole: UserRole.HUNTER,
        subjectUserId: users.landowner.id,
        rating: 5,
        title: "Enkelt fiskekort og tydelige regler",
        body: "Lett å kjøpe på mobilen, tydelig feltvisning og godt beskrevet område. Dette er den typen flyt som føles klar ute på tur.",
        moderationStatus: ReviewModerationStatus.APPROVED,
        publishedAt: addDays(today, -16),
      },
      {
        bookingId: bookingCompletedModeration.id,
        listingId: listingPublishedHunt.id,
        reviewerId: users.landowner.id,
        reviewerRole: UserRole.LANDOWNER,
        subjectUserId: users.hunter.id,
        rating: 2,
        title: "Oppfølging måtte tas i etterkant",
        body: "Gjestens rapportering ble først uklar og krevde mer oppfølging enn forventet.",
        moderationStatus: ReviewModerationStatus.FLAGGED,
        isFlagged: true,
        moderatorNotes: "Flagget for å teste adminmoderering av toveis vurderinger.",
      },
    ],
  });

  await prisma.hunterExperience.createMany({
    data: [
      {
        bookingId: bookingCompletedPublic.id,
        listingId: listingFishing.id,
        hunterId: users.hunter.id,
        title: "Kveldsfiske med enkel logistikk",
        summary: "Området var lett å finne, og feltvisningen gjorde det enkelt å holde seg innenfor rett strekning.",
        areaQualityNotes: "Rolig vann og tydelig inn- og utstigning.",
        accessNotes: "Kort gåavstand fra parkering.",
        localServicesNotes: "Greit utgangspunkt for overnatting i nærheten.",
        accommodationNotes: "Mange små steder å bo langs veien.",
        safetyNotes: "Vær obs på glatte steiner ved vannkanten.",
        moderationStatus: ExperienceModerationStatus.APPROVED,
        publishedAt: addDays(today, -16),
      },
      {
        bookingId: bookingCompletedModeration.id,
        listingId: listingPublishedHunt.id,
        hunterId: users.hunter.id,
        title: "Storviltopplevelse med mye manuell koordinering",
        summary: "Terrenget var bra, men kommunikasjonen om endelig valdavklaring kunne vært tydeligere.",
        areaQualityNotes: "Godt terreng for observasjon.",
        accessNotes: "Noe uklar parkering første kveld.",
        localServicesNotes: "Lokale kontakter var hjelpsomme.",
        safetyNotes: "Radio og møtepunkt bør være enda tydeligere.",
        moderationStatus: ExperienceModerationStatus.FLAGGED,
        moderatorNotes: "Flagget for å teste modereringskø for praktiske erfaringer.",
      },
    ],
  });

  await prisma.disputeTicket.create({
    data: {
      bookingId: bookingCompletedModeration.id,
      openedByUserId: users.hunter.id,
      assignedAdminId: users.admin.id,
      title: "Uenighet om rapportering etter endt jakt",
      description:
        "Denne saken brukes som demo for tvistesporet. Den handler om hvem som skulle sende endelig rapportering og når den skulle registreres.",
      status: DisputeStatus.OPEN,
    },
  });

  await prisma.complianceTask.createMany({
    data: [
      {
        userId: users.hunter.id,
        bookingId: bookingRequested.id,
        listingId: listingPublishedHunt.id,
        cwdZoneId,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.CWD_GUIDANCE,
        title: "Ta med CWD-veiledning til turen",
        description: "Denne bookingen overlapper en demosone for CWD og brukes for å teste varsler og oppfølging i turflyten.",
        actionLabel: "Les CWD-veiledning",
        actionUrl: "https://example.com/cwd-demo",
        dueAt: addDays(today, 17),
        status: ComplianceTaskStatus.OPEN,
      },
      {
        userId: users.hunter.id,
        bookingId: bookingFishingConfirmed.id,
        listingId: listingFishing.id,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.FISHING_FEE_CONFIRMATION,
        title: "Bekreft nasjonal fiskeavgift",
        description: "Laks og ørret i denne demoannonsen krever tydelig bekreftelse på nasjonal avgift før avreise.",
        actionLabel: "Åpne lisensvisning",
        actionUrl: "/dashboard/bookings/" + bookingFishingConfirmed.id + "/licence",
        dueAt: addDays(today, 5),
        status: ComplianceTaskStatus.IN_PROGRESS,
      },
      {
        userId: users.landowner.id,
        listingId: listingPendingReview.id,
        cwdZoneId,
        assigneeRole: UserRole.LANDOWNER,
        taskType: ComplianceTaskType.VALD_QUOTA_REVIEW,
        title: "Avklar kvote og delt godkjenning før publisering",
        description: "Denne demoannonsen har lav tillit, omtrentelig grense og manuell kommuneprosess. Perfekt for admin- og grunneierflyt.",
        actionLabel: "Åpne annonseutkast",
        actionUrl: "/dashboard/properties/" + propertyLowConfidence.id + "/listing",
        dueAt: addDays(today, 3),
        status: ComplianceTaskStatus.OPEN,
      },
      {
        userId: users.hunter.id,
        bookingId: bookingCompletedModeration.id,
        listingId: listingPublishedHunt.id,
        assigneeRole: UserRole.HUNTER,
        taskType: ComplianceTaskType.HJORTEVILT_REPORTING,
        title: "Rapportering etter gjennomført jakt",
        description: "Ferdig oppgave som viser hvordan fullførte storviltbestillinger ser ut i etterlevelsessporet.",
        actionLabel: "Åpne Hjorteviltregisteret",
        actionUrl: "https://www.hjorteviltregisteret.no/",
        dueAt: addDays(today, -30),
        status: ComplianceTaskStatus.COMPLETED,
        completedAt: addDays(today, -30),
      },
    ],
  });

  await prisma.notificationOutbox.createMany({
    data: [
      {
        userId: users.hunter.id,
        bookingId: bookingFishingConfirmed.id,
        channel: NotificationChannel.INTERNAL,
        template: "booking_update",
        subject: "Fiskekortet ditt er klart",
        body: "Bruk lisenssiden i Heyra når du er ved vannet. Geovarsling og feltvisning er aktiv for denne demoen.",
        status: NotificationStatus.SENT,
        sentAt: today,
      },
      {
        userId: users.landowner.id,
        bookingId: bookingApproved.id,
        channel: NotificationChannel.EMAIL,
        template: "booking_update",
        subject: "En godkjent forespørsel venter fortsatt på delt bekreftelse",
        body: "Denne bestillingen brukes som demo for delt styring. Sjekk valdstatus før du sender endelig svar.",
        status: NotificationStatus.PENDING,
      },
      {
        userId: users.servicePending.id,
        channel: NotificationChannel.INTERNAL,
        template: "provider_review",
        subject: "Leverandørprofilen din venter på gjennomgang",
        body: "Denne meldingen brukes for å teste admin- og leverandørflyten med ventende profiler.",
        status: NotificationStatus.PENDING,
      },
    ],
  });

  const approvedProfile = await prisma.serviceProviderProfile.create({
    data: {
      userId: users.service.id,
      reviewStatus: ServiceProviderReviewStatus.APPROVED,
      businessName: "Fjellklar Vertskap",
      publicContactName: "Morten Øvregård",
      phone: "+47 900 00 301",
      email: "service@heyra.local",
      website: "https://example.com/fjellklar",
      municipality: "Voss",
      county: "Vestland",
      latitude: 60.63,
      longitude: 6.42,
      yearsExperience: 9,
      description:
        "Lokal praktisk hjelp for gjester som trenger transport, hundeførerkoordinering og enkel overnattingsveiledning rundt turen.",
      qualifications: {
        licenseSummary: "Erfaren lokal aktør med demo-godkjent profil.",
        equipmentSummary: "Bil, henger og enkel feltlogistikk.",
        transportCoverage: "Voss og nærliggende dalfører.",
        accommodationDetails: "Kan hjelpe med å finne hytte og rom i nærheten.",
      },
      moderationNotes: "Godkjent demoprofil for testing av markedsplass og adminpanel.",
      reviewedAt: today,
      verifiedAt: today,
    },
  });

  const pendingProfile = await prisma.serviceProviderProfile.create({
    data: {
      userId: users.servicePending.id,
      reviewStatus: ServiceProviderReviewStatus.PENDING,
      businessName: "Ljosdal Transport & Hund",
      publicContactName: "Ida Ljosdal",
      phone: "+47 900 00 401",
      email: "service-pending@heyra.local",
      municipality: "Hemsedal",
      county: "Buskerud",
      latitude: 60.86,
      longitude: 8.56,
      yearsExperience: 4,
      description:
        "Mindre lokal aktør som kan bistå med transport og enkel ettersøkkoordinering, men som fortsatt venter på intern gjennomgang.",
      qualifications: {
        licenseSummary: "Under oppfølging.",
        equipmentSummary: "Personbil og enkel transport.",
        transportCoverage: "Hemsedal og nærliggende områder.",
        accommodationDetails: "",
      },
    },
  });

  await prisma.serviceListing.createMany({
    data: [
      {
        providerProfileId: approvedProfile.id,
        slug: "voss-hundeforer-og-transport",
        category: ServiceCategory.DOG_HANDLER,
        title: "Hundefører og transport i Voss",
        description:
          "Rask lokal bistand for gjester som trenger hundefører eller transport inn og ut av terreng.",
        municipality: "Voss",
        county: "Vestland",
        latitude: 60.63,
        longitude: 6.42,
        priceFromNok: 3200,
        qualifications: {
          licenseSummary: "Erfaren lokal hjelp.",
          equipmentSummary: "Bil og praktisk feltutstyr.",
          transportCoverage: "Voss og omegn.",
          accommodationDetails: "",
        },
        reviewerNotes: "Publisert demo for testing av tjenestemarked.",
        reviewedAt: today,
        publishedAt: today,
        status: ServiceListingStatus.PUBLISHED,
      },
      {
        providerProfileId: pendingProfile.id,
        slug: "hemsedal-transport-og-overnatting",
        category: ServiceCategory.TRANSPORT,
        title: "Transport og enkel overnatting i Hemsedal",
        description:
          "Ventende tjeneste som brukes til å teste adminmoderering, leverandørflyt og sammenhengen mellom annonser og lokale tjenester.",
        municipality: "Hemsedal",
        county: "Buskerud",
        latitude: 60.86,
        longitude: 8.56,
        priceFromNok: 1800,
        qualifications: {
          licenseSummary: "Må gjennomgås av admin.",
          equipmentSummary: "Bil og henger etter behov.",
          transportCoverage: "Hemsedal.",
          accommodationDetails: "Kan formidle enkel overnatting.",
        },
        reviewerNotes: "Ventende demo for test av kø.",
        status: ServiceListingStatus.PENDING_REVIEW,
      },
    ],
  });

  return {
    cwdZoneId,
    propertyIds: [propertyVald.id, propertyLowConfidence.id, propertyFishing.id],
    listingIds: [listingPublishedHunt.id, listingPendingReview.id, listingDraft.id, listingFishing.id],
  };
}

async function main() {
  await purgeDemoData();

  if (resetOnly) {
    console.log("Demo data reset complete. No new demo records were created.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = {};

  for (const account of demoAccounts) {
    users[account.key] = await createUser(account, passwordHash);
  }

  if (mode === "lite") {
    await seedLite(users);
  } else {
    await seedFull(users);
  }

  console.log(`Demo environment ready (${mode}).`);
  console.log("Credentials:");
  for (const account of demoAccounts) {
    console.log(`${account.email} / ${DEMO_PASSWORD}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed demo data.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
