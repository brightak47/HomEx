"use client";

import { useEffect, useState } from "react";

export function WatermarkOverlay({
  label,
}: {
  label: string;
}) {
  const [spot, setSpot] = useState({ x: 12, y: 18 });

  useEffect(() => {
    const move = () => {
      setSpot({
        x: 8 + Math.random() * 62,
        y: 12 + Math.random() * 68,
      });
    };
    move();
    const id = window.setInterval(move, 8000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute rounded-full bg-black/20 px-3 py-1 text-[10px] tracking-[0.18em] text-white/55 uppercase"
        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      >
        {label}
      </div>
    </div>
  );
}
