"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/shell";
import { FileUpload } from "@/components/file-upload";
import { api } from "@/lib/api";
import { estimateEarnings } from "@/lib/commission";
import { formatMoney, parsePriceToCents } from "@/lib/money";

const steps = ["Movie", "Premiere", "Ticket", "Watch party", "Review"];

const samplePoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80";
const sampleVideo =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export default function CreatePremierePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "Drama",
    runtimeMinutes: 110,
    posterUrl: samplePoster,
    trailerUrl: sampleVideo,
    movieAssetUrl: sampleVideo,
    director: "",
    country: "GH",
    castNames: "",
    scheduledAt: new Date(Date.now() + 36 * 60 * 60_000).toISOString().slice(0, 16),
    timezone: "Africa/Accra",
    durationMinutes: 120,
    ticketPrice: "10",
    currency: "USD",
    guestName: "",
    guestEmail: "",
    guestRole: "CELEBRITY",
  });

  const estimate = useMemo(() => {
    try {
      return estimateEarnings(parsePriceToCents(form.ticketPrice), 1000, {
        commissionType: "PERCENTAGE",
        percentageBps: 1000,
        fixedFeeCents: 100,
        minFeeCents: 0,
      });
    } catch {
      return null;
    }
  }, [form.ticketPrice]);

  function update(partial: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function payload(publish: boolean) {
    return {
      title: form.title,
      description: form.description,
      genre: form.genre,
      runtimeMinutes: Number(form.runtimeMinutes),
      posterUrl: form.posterUrl,
      trailerUrl: form.trailerUrl,
      movieAssetUrl: form.movieAssetUrl,
      director: form.director,
      country: form.country,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      timezone: form.timezone,
      durationMinutes: Number(form.durationMinutes),
      ticketPrice: form.ticketPrice,
      currency: form.currency,
      cast: form.castNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, role: "Cast" })),
      guests: form.guestEmail
        ? [{ name: form.guestName, email: form.guestEmail, guestRole: form.guestRole }]
        : [],
      publish,
    };
  }

  async function submit(publish: boolean) {
    setError("");
    setBusy(true);
    try {
      const premiere = await api<{ premiere: { id: string } }>("/api/premieres", {
        method: "POST",
        body: JSON.stringify(payload(publish)),
      });
      router.push(`/producer/premieres/${premiere.premiere.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save premiere");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell role="PRODUCER">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
        Step {step + 1} · {steps[step]}
      </p>
      <h1 className="display mt-2 text-4xl">Create premiere</h1>
      <div className="mt-6 space-y-3">
        {step === 0 && (
          <>
            <input className="field" placeholder="Movie title" value={form.title} onChange={(e) => update({ title: e.target.value })} />
            <textarea className="field min-h-28" placeholder="Short description" value={form.description} onChange={(e) => update({ description: e.target.value })} />
            <input className="field" placeholder="Genre" value={form.genre} onChange={(e) => update({ genre: e.target.value })} />
            <input className="field" placeholder="Director" value={form.director} onChange={(e) => update({ director: e.target.value })} />
            <input className="field" placeholder="Cast names, comma separated" value={form.castNames} onChange={(e) => update({ castNames: e.target.value })} />
            <input className="field" type="number" placeholder="Runtime minutes" value={form.runtimeMinutes} onChange={(e) => update({ runtimeMinutes: Number(e.target.value) })} />
            <input className="field" placeholder="Country code (GH)" value={form.country} onChange={(e) => update({ country: e.target.value })} />
            <FileUpload label="Poster" accept="image/*" value={form.posterUrl} onChange={(posterUrl) => update({ posterUrl })} />
            <FileUpload label="Trailer file" accept="video/*" value={form.trailerUrl} onChange={(trailerUrl) => update({ trailerUrl })} />
            <input
              className="field"
              placeholder="Or paste a YouTube trailer URL"
              value={form.trailerUrl}
              onChange={(e) => update({ trailerUrl: e.target.value })}
            />
            <FileUpload label="Premiere movie" accept="video/*" value={form.movieAssetUrl} onChange={(movieAssetUrl) => update({ movieAssetUrl })} />
          </>
        )}
        {step === 1 && (
          <>
            <input className="field" type="datetime-local" value={form.scheduledAt} onChange={(e) => update({ scheduledAt: e.target.value })} />
            <input className="field" placeholder="Time zone" value={form.timezone} onChange={(e) => update({ timezone: e.target.value })} />
            <input className="field" type="number" placeholder="Premiere duration" value={form.durationMinutes} onChange={(e) => update({ durationMinutes: Number(e.target.value) })} />
          </>
        )}
        {step === 2 && (
          <>
            <input className="field" placeholder="Ticket price" value={form.ticketPrice} onChange={(e) => update({ ticketPrice: e.target.value })} />
            <input className="field" placeholder="Currency" value={form.currency} onChange={(e) => update({ currency: e.target.value })} />
            {estimate && (
              <div className="rounded-3xl border border-white/10 p-4 text-sm">
                <p>Ticket price: {formatMoney(estimate.ticketPriceCents)}</p>
                <p>Tickets sold: 1,000</p>
                <p>Gross revenue: {formatMoney(estimate.grossRevenueCents)}</p>
                <p>HomEx commission: {formatMoney(estimate.commissionCents)}</p>
                <p className="text-gold">Producer earnings: {formatMoney(estimate.producerEarningsCents)}</p>
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <input className="field" placeholder="Guest name" value={form.guestName} onChange={(e) => update({ guestName: e.target.value })} />
            <input className="field" placeholder="Guest email" value={form.guestEmail} onChange={(e) => update({ guestEmail: e.target.value })} />
            <select className="field" value={form.guestRole} onChange={(e) => update({ guestRole: e.target.value })}>
              <option>ACTOR</option>
              <option>DIRECTOR</option>
              <option>CELEBRITY</option>
              <option>INFLUENCER</option>
              <option>SPECIAL_GUEST</option>
            </select>
          </>
        )}
        {step === 4 && (
          <div className="space-y-3 rounded-3xl border border-white/10 p-4">
            <img src={form.posterUrl} alt="" className="h-48 w-full rounded-2xl object-cover" />
            <p className="display text-2xl">{form.title || "Untitled"}</p>
            <p className="text-sm text-muted">
              {form.scheduledAt || "Date pending"} · {formatMoney(Number(form.ticketPrice || 0) * 100)}
            </p>
            <p className="text-sm text-gold-soft">{form.guestName ? `Watch with ${form.guestName}` : "No guests yet"}</p>
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button className="ghost-btn flex-1 py-3" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 4 ? (
          <button className="gold-btn flex-1 py-3" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <>
            <button className="ghost-btn flex-1 py-3" disabled={busy} onClick={() => void submit(false)}>
              Save draft
            </button>
            <button className="gold-btn flex-1 py-3" disabled={busy} onClick={() => void submit(true)}>
              {busy ? "Publishing…" : "Publish Premiere"}
            </button>
          </>
        )}
      </div>
    </PhoneShell>
  );
}
