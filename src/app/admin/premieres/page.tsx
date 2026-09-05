"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell";
import { api } from "@/lib/api";

type Row = {
  id: string;
  title: string;
  producer: string;
  status: string;
  ticketsSold: number;
  suspended: boolean;
};

export default function AdminPremieresPage() {
  const [premieres, setPremieres] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ premieres: Row[] }>("/api/admin/premieres");
    setPremieres(data.premieres);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <PhoneShell role="ADMIN">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Premieres</p>
      <h1 className="display mt-2 text-4xl">Moderate the reel</h1>
      <div className="mt-6 space-y-3">
        {premieres.map((premiere) => (
          <div key={premiere.id} className="rounded-2xl border border-white/10 p-4">
            <p className="display text-xl">{premiere.title}</p>
            <p className="text-sm text-muted">
              {premiere.producer} · {premiere.status.replaceAll("_", " ")} · {premiere.ticketsSold} tickets
            </p>
            <button
              className="ghost-btn mt-3 px-4 py-2 text-xs uppercase tracking-[0.16em]"
              onClick={async () => {
                await api("/api/admin/premieres", {
                  method: "POST",
                  body: JSON.stringify({ premiereId: premiere.id, suspended: !premiere.suspended }),
                });
                void load();
              }}
            >
              {premiere.suspended ? "Restore" : "Suspend"}
            </button>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
