import { AdminCompliancePageContent } from "@/components/admin/admin-compliance-page";

type PageProps = {
  searchParams?: Promise<{
    status?: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED" | "ALL";
    type?: "CWD_GUIDANCE" | "FISHING_FEE_CONFIRMATION" | "HJORTEVILT_REPORTING" | "SALMON_REPORTING" | "VALD_QUOTA_REVIEW" | "ALL";
  }>;
};

export default async function AdminCompliancePage({ searchParams }: PageProps) {
  return <AdminCompliancePageContent searchParams={searchParams} />;
}
