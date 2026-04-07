import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ServiceListingEditor } from "@/components/services/service-listing-editor";
import { canManageServices } from "@/lib/access";
import { serviceQualificationsSchema } from "@/lib/service-schema";
import { prisma } from "@/lib/prisma";

type ServiceEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServiceEditorPage({ params }: ServiceEditorPageProps) {
  const session = await auth();

  if (!canManageServices(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const service = await prisma.serviceListing.findFirst({
    where: {
      id,
      providerProfile: {
        userId: session.user.id,
      },
    },
    include: {
      providerProfile: true,
    },
  });

  if (!service) {
    redirect("/dashboard/services");
  }

  const qualifications = serviceQualificationsSchema.parse(service.qualifications ?? {});
  const providerQualifications = serviceQualificationsSchema.parse(service.providerProfile.qualifications ?? {});

  return (
    <main className="px-6 py-10 sm:px-8 md:px-10">
      <ServiceListingEditor
        mode="edit"
        providerProfile={{
          businessName: service.providerProfile.businessName,
          publicContactName: service.providerProfile.publicContactName ?? "",
          phone: service.providerProfile.phone ?? "",
          email: service.providerProfile.email ?? "",
          website: service.providerProfile.website ?? "",
          municipality: service.providerProfile.municipality,
          county: service.providerProfile.county,
          latitude: service.providerProfile.latitude,
          longitude: service.providerProfile.longitude,
          yearsExperience: service.providerProfile.yearsExperience,
          description: service.providerProfile.description,
          qualifications: providerQualifications,
        }}
        initialService={{
          id: service.id,
          slug: service.slug,
          category: service.category,
          title: service.title,
          description: service.description,
          municipality: service.municipality,
          county: service.county,
          latitude: service.latitude,
          longitude: service.longitude,
          priceFromNok: service.priceFromNok,
          qualifications,
          status: service.status,
          reviewerNotes: service.reviewerNotes,
        }}
      />
    </main>
  );
}
