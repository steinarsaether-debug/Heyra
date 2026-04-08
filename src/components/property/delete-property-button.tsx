"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/i18n/locale-provider";

export function DeletePropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      t("properties.deleteProperty.confirm"),
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t("properties.deleteProperty.error"));
      }

      router.push("/dashboard/properties");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("properties.deleteProperty.error"),
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-full border border-[#d9b9b0] bg-[#fff4f1] px-5 py-3 text-sm font-semibold text-[#8a2d1f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDeleting
          ? t("properties.deleteProperty.deleting")
          : t("properties.deleteProperty.action")}
      </button>
      {error ? (
        <p className="max-w-md rounded-2xl border border-[#e7b0a7] bg-[#fff0ed] px-4 py-3 text-sm text-[#7f3127]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
