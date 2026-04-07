"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
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

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-50 rounded-[1.4rem] border border-[#e7d6ae] bg-[#fff8eb] px-4 py-3 text-sm leading-7 text-[#6e5630] shadow-[0_12px_30px_rgba(16,42,33,0.14)] sm:left-8 sm:right-8">
      You are offline. Recently opened listings and booking pages may still work, but new requests and live updates will wait until the connection is back.
    </div>
  );
}
