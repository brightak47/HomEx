"use client";

import { useEffect, useRef, useState } from "react";
import { api, deviceId } from "@/lib/api";
import { WatermarkOverlay } from "./watermark-overlay";
import { Countdown } from "./countdown";

type JoinPayload = {
  sessionId: string;
  status: string;
  phase: string;
  positionMs: number;
  isPaused: boolean;
  watermark: { label: string };
  playback: { playbackUrl: string };
  watchParty: { canPublish: boolean };
};

const emojis = ["🔥", "👏", "❤️", "😮", "😂"];

export function PremiereRoom({
  premiereId,
  title,
  posterUrl,
  scheduledAt,
  guests,
  canControl,
}: {
  premiereId: string;
  title: string;
  posterUrl: string;
  scheduledAt: string;
  guests: { name: string; guestRole: string }[];
  canControl?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [join, setJoin] = useState<JoinPayload | null>(null);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ id: string; body: string; name: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [phase, setPhase] = useState("PRE_SHOW");
  const [tilesOpen, setTilesOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<JoinPayload>(`/api/premieres/${premiereId}/join`, {
      method: "POST",
      body: JSON.stringify({ deviceId: deviceId() }),
    })
      .then((payload) => {
        if (cancelled) return;
        setJoin(payload);
        setPhase(payload.phase);
        setTilesOpen(payload.phase !== "MOVIE");
      })
      .catch((err: Error) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [premiereId]);

  useEffect(() => {
    if (!join) return;
    const video = videoRef.current;
    if (video && join.phase === "MOVIE") {
      video.currentTime = Math.max(0, join.positionMs / 1000);
      if (!join.isPaused) void video.play().catch(() => undefined);
    }

    const sync = window.setInterval(async () => {
      const state = await api<{
        phase: string;
        positionMs: number;
        isPaused: boolean;
      }>(`/api/premieres/${premiereId}/playback`);
      setPhase(state.phase);
      const player = videoRef.current;
      if (player && state.phase === "MOVIE") {
        const drift = Math.abs(player.currentTime - state.positionMs / 1000);
        if (drift > 2.5) player.currentTime = state.positionMs / 1000;
        if (state.isPaused) player.pause();
        else void player.play().catch(() => undefined);
      }
      await api("/api/playback/heartbeat", {
        method: "POST",
        body: JSON.stringify({ sessionId: join.sessionId }),
      }).catch(() => undefined);
    }, 8000);

    const social = window.setInterval(async () => {
      const chat = await api<{ messages: { id: string; body: string; name: string }[] }>(
        `/api/premieres/${premiereId}/chat`,
      );
      setMessages(chat.messages);
    }, 2500);

    return () => {
      window.clearInterval(sync);
      window.clearInterval(social);
    };
  }, [join, premiereId]);

  async function sendChat() {
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    await api(`/api/premieres/${premiereId}/chat`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  async function react(emoji: string) {
    setReactions((current) => [...current, { id: Date.now(), emoji }].slice(-8));
    await api(`/api/premieres/${premiereId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  }

  if (error) {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
        <p className="display text-2xl text-gold-soft">Doors closed</p>
        <p className="mt-3 text-muted">{error}</p>
      </div>
    );
  }

  if (!join) {
    return <div className="flex min-h-[80dvh] items-center justify-center text-muted">Finding your seat…</div>;
  }

  const movieOn = phase === "MOVIE";
  const tiles = guests.length ? guests : [{ name: "Host", guestRole: "HOST" }];

  return (
    <div className="relative min-h-[100dvh] bg-black">
      <div className="relative aspect-video min-h-[240px] w-full overflow-hidden bg-black">
        {movieOn ? (
          <video
            ref={videoRef}
            src={join.playback.playbackUrl}
            poster={posterUrl}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
          />
        ) : (
          <img src={posterUrl} alt="" className="h-full w-full object-cover opacity-70" />
        )}
        <WatermarkOverlay label={join.watermark.label} />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
          <span className="live-dot" />
          {phase.replace("_", " ")}
        </div>
        {!movieOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="display text-3xl">{title}</p>
            <p className="mt-2 text-sm text-gold-soft">
              {phase === "AFTER_SHOW" ? "Cast Q&A" : "Pre-show"} · <Countdown iso={scheduledAt} />
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center gap-3 text-2xl">
          {reactions.map((item) => (
            <span key={item.id}>{item.emoji}</span>
          ))}
        </div>
      </div>

      <section className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live watch party</p>
          <button className="text-[11px] uppercase tracking-[0.16em] text-gold" onClick={() => setTilesOpen(!tilesOpen)}>
            {tilesOpen ? "Minimize" : "Show guests"}
          </button>
        </div>
        {tilesOpen && (
          <div className="mt-3 flex gap-3 overflow-x-auto hide-scroll">
            {tiles.map((guest) => (
              <div key={guest.name} className="min-w-[88px]">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gold/30 bg-[#16161d]">
                  <span className="text-lg text-gold">{guest.name.slice(0, 1)}</span>
                  <span className="live-dot absolute right-2 top-2" />
                </div>
                <p className="mt-2 truncate text-xs text-cream">{guest.name}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted">{guest.guestRole}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-10 pt-5">
        <div className="flex gap-2">
          {emojis.map((emoji) => (
            <button key={emoji} className="ghost-btn px-3 py-2" onClick={() => void react(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
          {messages.map((message) => (
            <p key={message.id} className="text-sm">
              <span className="text-gold-soft">{message.name}</span>{" "}
              <span className="text-cream/85">{message.body}</span>
            </p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="field"
            placeholder="Say something to the room"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void sendChat();
            }}
          />
          <button className="gold-btn px-4" onClick={() => void sendChat()}>
            Send
          </button>
        </div>
        {canControl && (
          <div className="mt-4 flex gap-2">
            {["start", "pause", "resume", "end"].map((action) => (
              <button
                key={action}
                className="ghost-btn px-3 py-2 text-xs uppercase tracking-[0.16em]"
                onClick={() =>
                  void api(`/api/premieres/${premiereId}/playback/control`, {
                    method: "POST",
                    body: JSON.stringify({ action }),
                  })
                }
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
