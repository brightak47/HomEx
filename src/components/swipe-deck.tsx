"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Countdown, formatShowtime } from "./countdown";
import { formatMoney } from "@/lib/money";
import { api } from "@/lib/api";
import type { PremiereCard } from "@/lib/types";

export function SwipeDeck({ premieres }: { premieres: PremiereCard[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const current = premieres[index];
  const next = premieres[index + 1];

  const rotation = useMemo(() => offset / 28, [offset]);

  if (!current) {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
        <p className="display text-2xl text-gold-soft">That&apos;s the reel</p>
        <p className="mt-3 text-muted">New premieres will appear here as producers publish.</p>
      </div>
    );
  }

  const finish = async (direction: "left" | "right") => {
    if (direction === "right") {
      await api("/api/saved", {
        method: "POST",
        body: JSON.stringify({ premiereId: current.id }),
      }).catch(() => undefined);
    }
    setOffset(direction === "right" ? 520 : -520);
    window.setTimeout(() => {
      setIndex((value) => value + 1);
      setOffset(0);
    }, 220);
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black">
      <Link
        href="/search"
        className="absolute left-5 top-5 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cream backdrop-blur"
      >
        Search
      </Link>
      {next && (
        <article className="absolute inset-0 scale-[0.96] opacity-60">
          <img src={next.posterUrl} alt="" className="h-full w-full object-cover" />
        </article>
      )}
      <article
        className="absolute inset-0"
        style={{
          transform: `translateX(${offset}px) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 220ms ease",
        }}
        onPointerDown={(event) => {
          setDragging(true);
          startX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          setOffset(event.clientX - startX.current);
        }}
        onPointerUp={() => {
          setDragging(false);
          if (offset > 110) void finish("right");
          else if (offset < -110) void finish("left");
          else setOffset(0);
        }}
        onClick={() => {
          if (Math.abs(offset) < 8) router.push(`/movies/${current.id}`);
        }}
      >
        <img src={current.posterUrl} alt={current.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90" />
        {offset > 40 && (
          <div className="absolute left-6 top-28 rotate-[-12deg] rounded-full border-2 border-gold px-4 py-1 text-sm uppercase tracking-[0.2em] text-gold">
            Saved
          </div>
        )}
        {offset < -40 && (
          <div className="absolute right-6 top-28 rotate-[12deg] rounded-full border-2 border-white/70 px-4 py-1 text-sm uppercase tracking-[0.2em] text-white">
            Skip
          </div>
        )}
        <div className="absolute inset-x-0 bottom-24 px-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
            Premieres {formatShowtime(current.scheduledAt, current.timezone)}
          </p>
          <h1 className="display mt-2 text-4xl text-cream">{current.title}</h1>
          <p className="mt-2 line-clamp-2 text-sm text-cream/80">{current.description}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
            {current.genre} · {current.studioName}
          </p>
          {current.guests.length > 0 && (
            <p className="mt-2 text-sm text-gold-soft">
              Watch live with {current.guests.map((guest) => guest.name).join(", ")}
            </p>
          )}
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Countdown</p>
              <p className="text-xl text-cream">
                <Countdown iso={current.scheduledAt} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Ticket</p>
              <p className="text-xl text-gold">{formatMoney(current.ticketPriceCents, current.currency)}</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className="ghost-btn flex-1 py-3"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/movies/${current.id}?trailer=1`);
              }}
            >
              Trailer
            </button>
            <button
              className="gold-btn flex-1 py-3"
              onClick={(event) => {
                event.stopPropagation();
                router.push(current.canJoin ? `/premiere/${current.id}` : `/checkout/${current.id}`);
              }}
            >
              {current.canJoin ? "Join Premiere" : "Buy Ticket"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
