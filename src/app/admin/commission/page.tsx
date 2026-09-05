"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell";
import { api } from "@/lib/api";

type Settings = {
  commissionType: "PERCENTAGE" | "FIXED";
  percentageBps: number;
  fixedFeeCents: number;
  minFeeCents: number;
  maxConcurrentStreams: number;
  terminatePriorSession: boolean;
};

export default function CommissionPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api<{ settings: Settings }>("/api/admin/commission").then((data) => setSettings(data.settings));
  }, []);

  if (!settings) return <PhoneShell role="ADMIN"><div className="text-muted">Loading…</div></PhoneShell>;

  return (
    <PhoneShell role="ADMIN">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Commission</p>
      <h1 className="display mt-2 text-4xl">How HomEx earns</h1>
      <div className="mt-6 space-y-3">
        <select
          className="field"
          value={settings.commissionType}
          onChange={(e) => setSettings({ ...settings, commissionType: e.target.value as Settings["commissionType"] })}
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed fee</option>
        </select>
        <input
          className="field"
          type="number"
          value={settings.percentageBps / 100}
          onChange={(e) => setSettings({ ...settings, percentageBps: Math.round(Number(e.target.value) * 100) })}
        />
        <p className="text-xs text-muted">Percentage commission</p>
        <input
          className="field"
          type="number"
          value={settings.fixedFeeCents / 100}
          onChange={(e) => setSettings({ ...settings, fixedFeeCents: Math.round(Number(e.target.value) * 100) })}
        />
        <p className="text-xs text-muted">Fixed fee per ticket (USD)</p>
        <input
          className="field"
          type="number"
          value={settings.maxConcurrentStreams}
          onChange={(e) => setSettings({ ...settings, maxConcurrentStreams: Number(e.target.value) })}
        />
        <p className="text-xs text-muted">Max concurrent streams per ticket</p>
        <button
          className="gold-btn w-full py-3"
          onClick={async () => {
            await api("/api/admin/commission", {
              method: "POST",
              body: JSON.stringify(settings),
            });
            setSaved("Saved");
          }}
        >
          Save settings
        </button>
        {saved && <p className="text-sm text-gold-soft">{saved}</p>}
      </div>
    </PhoneShell>
  );
}
