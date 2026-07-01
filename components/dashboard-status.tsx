"use client";

import { useEffect, useState } from "react";

export function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-full border border-line bg-white px-4 py-2 text-center text-[13px] font-semibold text-muted shadow-sm">
      {new Intl.DateTimeFormat("en-MT", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Malta"
      }).format(now)}
    </div>
  );
}
