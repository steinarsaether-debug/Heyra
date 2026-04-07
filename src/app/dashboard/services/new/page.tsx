import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ServiceListingEditor } from "@/components/services/service-listing-editor";
import { canManageServices } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function NewServicePage() {
  const session = await auth();

  if (!canManageServices(session)) {
    redirect("/dashboard");
  }

  const profile = await prisma.serviceProviderProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!profile) {
    redirect("/dashboard/services");
  }

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <ServiceListingEditor
        mode="create"
        providerProfile={{
          businessName: profile.businessName,
          publicContactName: profile.publicContactName ?? "",
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          website: profile.website ?? "",
          municipality: profile.municipality,
          county: profile.county,
          latitude: profile.latitude,
          longitude: profile.longitude,
          yearsExperience: profile.yearsExperience,
          description: profile.description,
          qualifications: {
            licenseSummary:
              ((profile.qualifications as { licenseSummary?: string } | null)?.licenseSummary ?? ""),
            equipmentSummary:
              ((profile.qualifications as { equipmentSummary?: string } | null)?.equipmentSummary ?? ""),
            transportCoverage:
              ((profile.qualifications as { transportCoverage?: string } | null)?.transportCoverage ?? ""),
            accommodationDetails:
              ((profile.qualifications as { accommodationDetails?: string } | null)?.accommodationDetails ?? ""),
          },
        }}
      />
    </main>
  );
}
