"use client";

import { useEffect, useState } from "react";

export function OfflinePageNote({
  onlineText,
  offlineText,
}: {
  onlineText: string;
  offlineText: string;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`rounded-[1.4rem] border px-4 py-3 text-sm leading-7 ${
        isOnline
          ? "border-[var(--border)] bg-white/75 text-[var(--muted)]"
          : "border-[#e7d6ae] bg-[#fff8eb] text-[#6e5630]"
      }`}
    >
      {isOnline ? onlineText : offlineText}
    </div>
  );
}
