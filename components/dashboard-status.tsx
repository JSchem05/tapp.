"use client";

import { useEffect, useState } from "react";

export function OpenClosedToggle() {
  const [open, setOpen] = useState(true);

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm font-bold text-ink shadow-sm transition hover:bg-[#FAFAFA] hover:shadow-soft"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          open ? "bg-green-500" : "bg-muted"
        }`}
      />
      {open ? "Open" : "Closed"}
    </button>
  );
}

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
