import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPremiereForUser } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { Countdown } from "@/components/countdown";
import { formatShowtime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export default async function MovieDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trailer?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/");
  const { id } = await params;
  const query = await searchParams;
  const result = await getPremiereForUser(id, user.id);
  if (!result) notFound();
  const premiere = result.dto;
  const cta = premiere.canJoin
    ? { href: `/premiere/${premiere.id}`, label: "Join Premiere" }
    : premiere.ticketStatus
      ? { href: `/tickets`, label: "Ticket Confirmed" }
      : { href: `/checkout/${premiere.id}`, label: "Buy Ticket" };

  return (
    <PhoneShell role={user.role}>
      <img src={premiere.posterUrl} alt="" className="h-[420px] w-full object-cover" />
      <div className="-mt-16 space-y-4 px-5 pb-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
          {premiere.genre} · {premiere.runtimeMinutes} min
        </p>
        <h1 className="display text-4xl">{premiere.title}</h1>
        <p className="text-sm text-cream/80">{premiere.description}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {premiere.studioName} · Dir. {premiere.director}
        </p>
        <div className="rounded-3xl border border-white/10 bg-[#121218] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Premieres {formatShowtime(premiere.scheduledAt, premiere.timezone)}
          </p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Countdown</p>
              <p className="text-2xl">
                <Countdown iso={premiere.scheduledAt} />
              </p>
            </div>
            <p className="text-2xl text-gold">{formatMoney(premiere.ticketPriceCents, premiere.currency)}</p>
          </div>
          {premiere.attendeeCount != null && (
            <p className="mt-2 text-xs text-muted">{premiere.attendeeCount} attending</p>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Cast</p>
          <p className="mt-2 text-sm">{premiere.cast.map((member) => `${member.name}`).join(" · ")}</p>
        </div>
        {premiere.guests.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Watch party</p>
            <p className="mt-2 text-sm text-gold-soft">
              Live premiere with {premiere.guests.map((guest) => guest.name).join(", ")}
            </p>
          </div>
        )}
        {(query.trailer || true) && (
          <video
            src={premiere.trailerUrl}
            controls
            playsInline
            poster={premiere.posterUrl}
            className="w-full rounded-3xl"
          />
        )}
        <Link href={cta.href} className="gold-btn block py-3 text-center">
          {cta.label}
        </Link>
      </div>
    </PhoneShell>
  );
}
