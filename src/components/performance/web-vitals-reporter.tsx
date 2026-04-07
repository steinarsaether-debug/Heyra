"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === "undefined") {
      return;
    }

    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      pathname: window.location.pathname,
    });

    if ("sendBeacon" in navigator) {
      navigator.sendBeacon("/api/telemetry/web-vitals", body);
      return;
    }

    void fetch("/api/telemetry/web-vitals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  });

  return null;
}
