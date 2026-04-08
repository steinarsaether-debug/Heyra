"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/i18n/locale-provider";

export function DeleteListingButton({
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
      t("listings.deleteListing.confirm"),
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}/listing`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t("listings.deleteListing.error"));
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("listings.deleteListing.error"),
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
          ? t("listings.deleteListing.deleting")
          : t("listings.deleteListing.action")}
      </button>
      {error ? (
        <p className="max-w-md rounded-2xl border border-[#e7b0a7] bg-[#fff0ed] px-4 py-3 text-sm text-[#7f3127]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
