import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/request";
import { localizePathname } from "@/lib/i18n/config";

export default async function AdminIndexPage() {
  const locale = await getRequestLocale();
  redirect(localizePathname(locale, "/admin/reviews"));
}
