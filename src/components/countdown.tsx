"use client";

import { useEffect, useState } from "react";

export function Countdown({ iso }: { iso: string }) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(iso).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("NOW");
        return;
      }
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setLabel(`${days}d ${hours % 24}h`);
        return;
      }
      setLabel(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [iso]);

  return <span className="tabular-nums">{label}</span>;
}

export function formatShowtime(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}
