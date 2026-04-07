import { redirect } from "next/navigation";
import { localizePathname } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/request";

export default async function LegacyAdminReviewsPage() {
  const locale = await getRequestLocale();
  redirect(localizePathname(locale, "/admin/reviews"));
}
