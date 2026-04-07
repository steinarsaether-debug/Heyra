import { NotificationPreference, NotificationStatus } from "@prisma/client";

export function getDefaultNotificationPreferences() {
  return {
    bookingUpdates: true,
    contractUpdates: true,
    payoutUpdates: true,
    complianceReminders: true,
    marketingUpdates: false,
    pushEnabled: false,
    pushPermission: "default",
  };
}

export function shouldQueueNotification(
  preference: NotificationPreference | null,
  template: string,
) {
  const prefs = preference ?? getDefaultNotificationPreferences();

  if (template.includes("booking") && !prefs.bookingUpdates) {
    return false;
  }

  if (template.includes("contract") && !prefs.contractUpdates) {
    return false;
  }

  if (template.includes("payout") && !prefs.payoutUpdates) {
    return false;
  }

  if (template.includes("compliance") && !prefs.complianceReminders) {
    return false;
  }

  if (template.includes("marketing") && !prefs.marketingUpdates) {
    return false;
  }

  return true;
}

export function getNotificationDeliveryStatus(pushEnabled: boolean, pushPermission: string | null) {
  if (!pushEnabled) {
    return "Push is turned off.";
  }

  if (pushPermission !== "granted") {
    return "Push is enabled in Heyra, but the browser permission is not granted yet.";
  }

  return "Push is ready for local browser notifications.";
}

export function formatNotificationStatus(status: NotificationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
