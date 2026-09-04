import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePremiereStatus, canJoinPremiere } from "@/lib/lifecycle";
import { PhoneShell } from "@/components/shell";
import { Countdown } from "@/components/countdown";

export default async function TicketsPage() {
  const user = await getSession();
  if (!user) redirect("/");
  const tickets = await db.ticket.findMany({
    where: { userId: user.id },
    include: { premiere: { include: { movie: true } } },
    orderBy: { purchasedAt: "desc" },
  });

  return (
    <PhoneShell role={user.role}>
      <div className="px-5 pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">My tickets</p>
        <h1 className="display mt-2 text-4xl">Your seats</h1>
        <div className="mt-6 space-y-4">
          {tickets.length === 0 && <p className="text-muted">No tickets yet. Swipe the reel.</p>}
          {tickets.map((ticket) => {
            const status = resolvePremiereStatus(ticket.premiere);
            return (
              <Link
                key={ticket.id}
                href={canJoinPremiere(status) ? `/premiere/${ticket.premiereId}` : `/movies/${ticket.premiereId}`}
                className="block overflow-hidden rounded-3xl border border-white/10"
              >
                <div className="relative h-48">
                  <img src={ticket.premiere.movie.posterUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="display text-2xl">{ticket.premiere.movie.title}</p>
                    <p className="text-sm text-gold-soft">
                      {status.replaceAll("_", " ")} · <Countdown iso={ticket.premiere.scheduledAt.toISOString()} />
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PhoneShell>
  );
}
