import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ServiceCategory,
  ServiceListingStatus,
  ServiceProviderReviewStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "HeyraDemo2026!";

const accounts = [
  {
    email: "admin@heyra.local",
    role: UserRole.ADMIN,
    fullName: "Heyra Admin",
  },
  {
    email: "landowner@heyra.local",
    role: UserRole.LANDOWNER,
    fullName: "Demo Landowner",
  },
  {
    email: "hunter@heyra.local",
    role: UserRole.HUNTER,
    fullName: "Demo Hunter",
  },
  {
    email: "service@heyra.local",
    role: UserRole.HUNTER,
    fullName: "Demo Service Provider",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: {
        email: account.email,
      },
      update: {
        role: account.role,
        status: UserStatus.ACTIVE,
        statusReason: null,
        suspendedAt: null,
        deactivatedAt: null,
        passwordHash,
        emailVerified: new Date(),
      },
      create: {
        email: account.email,
        role: account.role,
        status: UserStatus.ACTIVE,
        passwordHash,
        emailVerified: new Date(),
      },
      select: {
        id: true,
      },
    });

    await prisma.userPii.upsert({
      where: {
        userId: user.id,
      },
      update: {
        fullName: account.fullName,
      },
      create: {
        userId: user.id,
        fullName: account.fullName,
      },
    });

    await prisma.notificationPreference.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
    });

    if (account.email === "service@heyra.local") {
      const profile = await prisma.serviceProviderProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          reviewStatus: ServiceProviderReviewStatus.APPROVED,
          businessName: "Fjellklar Service",
          publicContactName: account.fullName,
          phone: "+47 900 11 222",
          email: account.email,
          municipality: "Voss",
          county: "Vestland",
          latitude: 60.63,
          longitude: 6.42,
          yearsExperience: 9,
          description:
            "Local practical support for visiting hunters and fishers, including dog-handling coordination, transport planning, and nearby accommodation guidance.",
          qualifications: {
            licenseSummary: "Documented local practical experience and reviewed public marketplace profile.",
            equipmentSummary: "Trailer, transport vehicle, and field logistics support available on request.",
            transportCoverage: "Covers Voss and nearby valleys by agreement.",
            accommodationDetails: "Can help coordinate cabins and overnight stays nearby.",
          },
          moderationNotes: "Demo provider profile approved for local testing.",
          reviewedAt: new Date(),
          verifiedAt: new Date(),
        },
        create: {
          userId: user.id,
          reviewStatus: ServiceProviderReviewStatus.APPROVED,
          businessName: "Fjellklar Service",
          publicContactName: account.fullName,
          phone: "+47 900 11 222",
          email: account.email,
          municipality: "Voss",
          county: "Vestland",
          latitude: 60.63,
          longitude: 6.42,
          yearsExperience: 9,
          description:
            "Local practical support for visiting hunters and fishers, including dog-handling coordination, transport planning, and nearby accommodation guidance.",
          qualifications: {
            licenseSummary: "Documented local practical experience and reviewed public marketplace profile.",
            equipmentSummary: "Trailer, transport vehicle, and field logistics support available on request.",
            transportCoverage: "Covers Voss and nearby valleys by agreement.",
            accommodationDetails: "Can help coordinate cabins and overnight stays nearby.",
          },
          moderationNotes: "Demo provider profile approved for local testing.",
          reviewedAt: new Date(),
          verifiedAt: new Date(),
        },
      });

      await prisma.serviceListing.upsert({
        where: {
          slug: "voss-dog-handler-support",
        },
        update: {
          category: ServiceCategory.DOG_HANDLER,
          title: "Voss dog-handler support",
          description:
            "On-call local dog-handling support for recovery coordination, practical handoff with landowners, and quick arrival in the Voss area.",
          municipality: "Voss",
          county: "Vestland",
          latitude: 60.63,
          longitude: 6.42,
          priceFromNok: 3200,
          qualifications: {
            licenseSummary: "Experienced local support with reviewed public profile.",
            equipmentSummary: "Vehicle transport and practical recovery coordination.",
            transportCoverage: "Voss and nearby areas.",
            accommodationDetails: "",
          },
          reviewerNotes: "Demo service approved for local testing.",
          reviewedAt: new Date(),
          publishedAt: new Date(),
          status: ServiceListingStatus.PUBLISHED,
        },
        create: {
          providerProfileId: profile.id,
          slug: "voss-dog-handler-support",
          category: ServiceCategory.DOG_HANDLER,
          title: "Voss dog-handler support",
          description:
            "On-call local dog-handling support for recovery coordination, practical handoff with landowners, and quick arrival in the Voss area.",
          municipality: "Voss",
          county: "Vestland",
          latitude: 60.63,
          longitude: 6.42,
          priceFromNok: 3200,
          qualifications: {
            licenseSummary: "Experienced local support with reviewed public profile.",
            equipmentSummary: "Vehicle transport and practical recovery coordination.",
            transportCoverage: "Voss and nearby areas.",
            accommodationDetails: "",
          },
          reviewerNotes: "Demo service approved for local testing.",
          reviewedAt: new Date(),
          publishedAt: new Date(),
          status: ServiceListingStatus.PUBLISHED,
        },
      });
    }
  }

  console.log("Demo accounts ready:");
  for (const account of accounts) {
    console.log(`${account.role}: ${account.email} / ${DEMO_PASSWORD}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed demo accounts.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
