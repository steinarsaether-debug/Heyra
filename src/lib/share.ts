import { type ListingType } from "@prisma/client";
import { absoluteUrl } from "@/lib/site";
import { formatListingType } from "@/lib/listing-view";

export function buildTrackedShareUrl(
  path: string,
  input?: {
    source?: string;
    campaign?: string;
  },
) {
  const url = new URL(absoluteUrl(path));

  if (input?.source) {
    url.searchParams.set("share_source", input.source);
  }

  if (input?.campaign) {
    url.searchParams.set("share_campaign", input.campaign);
  }

  return url.toString();
}

export function buildLandownerShareCaption(input: {
  title: string;
  municipality: string;
  county: string;
  type: ListingType;
}) {
  return `I’ve just published ${input.title} on Heyra. It’s a ${formatListingType(input.type).toLowerCase()} listing in ${input.municipality}, ${input.county}. Take a look if you want a well-prepared trip with clear rules and booking details.`;
}

export function buildGuestExperienceCaption(input: {
  title: string;
  municipality: string;
  county: string;
}) {
  return `I used Heyra for ${input.title} in ${input.municipality}, ${input.county}. Worth a look if you want a simpler way to find and book hunting or fishing access in Norway.`;
}

export function buildShareLinks(input: {
  shareUrl: string;
  title: string;
  caption: string;
}) {
  const encodedUrl = encodeURIComponent(input.shareUrl);
  const encodedCaption = encodeURIComponent(`${input.caption} ${input.shareUrl}`);
  const encodedTitle = encodeURIComponent(input.title);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedCaption}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedCaption}`,
  };
}

export function buildLandownerCampaignPresets(input: {
  slug: string;
  title: string;
  municipality: string;
  county: string;
  type: ListingType;
}) {
  const campaigns = [
    {
      key: "personal-network",
      label: "Personal network",
      source: "landowner",
      campaign: "personal-network",
      caption: `I’m sharing ${input.title} with my own network first. If you know someone looking for ${formatListingType(input.type).toLowerCase()} access in ${input.municipality}, ${input.county}, feel free to pass this on.`,
    },
    {
      key: "facebook-groups",
      label: "Facebook groups",
      source: "facebook-group",
      campaign: "community-post",
      caption: `${input.title} is now live on Heyra. Suitable for people looking for ${formatListingType(input.type).toLowerCase()} access in ${input.municipality}, ${input.county}. Full details and rules are in the listing.`,
    },
    {
      key: "repeat-guests",
      label: "Repeat guests",
      source: "repeat-guests",
      campaign: "returning-interest",
      caption: `If you have visited this area before, I’ve now published ${input.title} on Heyra with the current rules, pricing, and trip details in one place.`,
    },
  ];

  return campaigns.map((campaign) => {
    const shareUrl = buildTrackedShareUrl(`/listings/${input.slug}`, {
      source: campaign.source,
      campaign: campaign.campaign,
    });

    return {
      ...campaign,
      shareUrl,
      links: buildShareLinks({
        shareUrl,
        title: input.title,
        caption: campaign.caption,
      }),
    };
  });
}
