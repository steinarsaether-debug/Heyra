import { ServiceProviderReviewStatus } from "@prisma/client";

export type ServiceTrustBadge = {
  label: string;
  detail: string;
  tone: "forest" | "amber";
};

export function getServiceTrustBadge(input: {
  reviewStatus: ServiceProviderReviewStatus;
  verifiedAt: Date | null;
  yearsExperience: number | null;
  publishedServices: number;
}) {
  if (input.reviewStatus === ServiceProviderReviewStatus.APPROVED && input.verifiedAt) {
    return {
      label: "Verified local provider",
      detail: "This provider profile has been reviewed for public marketplace use.",
      tone: "forest",
    } satisfies ServiceTrustBadge;
  }

  if ((input.yearsExperience ?? 0) >= 5 && input.publishedServices >= 1) {
    return {
      label: "Experienced local provider",
      detail: "This provider has practical local experience and published services in the marketplace.",
      tone: "amber",
    } satisfies ServiceTrustBadge;
  }

  return null;
}

export function getServiceTrustSummary(input: {
  reviewStatus: ServiceProviderReviewStatus;
  verifiedAt: Date | null;
  yearsExperience: number | null;
  publishedServices: number;
}) {
  if (input.reviewStatus === ServiceProviderReviewStatus.APPROVED && input.verifiedAt) {
    return "Reviewed for public service listings";
  }

  if ((input.yearsExperience ?? 0) >= 5 && input.publishedServices >= 1) {
    return "Experienced local provider";
  }

  return "New provider profile";
}
