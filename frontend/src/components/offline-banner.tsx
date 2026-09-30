import { useEffect, useState } from "react";
import { strings } from "@/i18n/strings";

export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-14 z-50 border-t border-warning/30 bg-warning/15 px-4 py-2 text-center text-xs font-medium text-warning"
    >
      {strings.offline.message}
    </div>
  );
}
