import { NotificationChannel, NotificationPreference, NotificationStatus } from "@prisma/client";

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
    return "Push-varsler er slått av.";
  }

  if (pushPermission !== "granted") {
    return "Push er slått på i Heyra, men nettleseren har ikke gitt tillatelse ennå.";
  }

  return "Push er klart for lokale nettleservarsler.";
}

export function formatNotificationChannel(channel: NotificationChannel) {
  switch (channel) {
    case NotificationChannel.EMAIL:
      return "E-post";
    case NotificationChannel.PUSH:
      return "Push";
    case NotificationChannel.INTERNAL:
      return "I appen";
  }
}

export function formatNotificationStatus(status: NotificationStatus) {
  switch (status) {
    case NotificationStatus.PENDING:
      return "Venter";
    case NotificationStatus.SENT:
      return "Sendt";
    case NotificationStatus.FAILED:
      return "Feilet";
  }
}
