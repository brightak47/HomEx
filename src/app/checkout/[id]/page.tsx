"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { PhoneShell } from "@/components/shell";
import type { PremiereCard } from "@/lib/types";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [premiere, setPremiere] = useState<PremiereCard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ premiere: PremiereCard }>(`/api/premieres/${id}`).then((data) => setPremiere(data.premiere));
  }, [id]);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        alreadyOwned?: boolean;
        demo?: boolean;
        redirectTo?: string;
        checkoutUrl?: string;
      }>(`/api/premieres/${id}/checkout`, { method: "POST" });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      router.push(result.redirectTo || `/tickets/confirmed/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!premiere) return <PhoneShell><div className="p-8 text-muted">Preparing checkout…</div></PhoneShell>;

  return (
    <PhoneShell>
      <div className="px-5 pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Checkout</p>
        <h1 className="display mt-2 text-4xl">{premiere.title}</h1>
        <img src={premiere.posterUrl} alt="" className="mt-5 h-64 w-full rounded-3xl object-cover" />
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#121218] p-5">
          <div className="flex items-center justify-between">
            <span className="text-muted">Digital premiere ticket</span>
            <span className="text-2xl text-gold">
              {formatMoney(premiere.ticketPriceCents, premiere.currency)}
            </span>
          </div>
          <p className="mt-3 text-sm text-cream/70">
            One seat. One stream. Access to the live watch party and synchronized premiere.
          </p>
        </div>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <button className="gold-btn mt-6 w-full py-3" disabled={busy} onClick={() => void pay()}>
          {busy ? "Securing your seat…" : "Confirm ticket"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Demo checkout is enabled until Stripe keys are added.
        </p>
      </div>
    </PhoneShell>
  );
}
