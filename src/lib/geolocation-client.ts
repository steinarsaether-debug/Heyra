"use client";

export function getGeolocationUnavailableMessage() {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return "Location is not available on this device.";
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Location access usually only works on HTTPS or on localhost. This network URL is using HTTP, so the browser may block the permission prompt.";
  }

  return null;
}

export function getGeolocationErrorMessage() {
  const unavailableMessage = getGeolocationUnavailableMessage();

  if (unavailableMessage) {
    return unavailableMessage;
  }

  return "Location access was not granted. Check the browser's site permissions and try again.";
}
