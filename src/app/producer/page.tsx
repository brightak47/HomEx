import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { producerOverview } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { Countdown } from "@/components/countdown";
import { formatMoney } from "@/lib/money";

export default async function ProducerHomePage() {
  const user = await getSession();
  if (!user || (user.role !== "PRODUCER" && user.role !== "ADMIN")) redirect("/");
  const overview = await producerOverview(user.id);

  return (
    <PhoneShell role="PRODUCER">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Producer</p>
      <h1 className="display mt-2 text-4xl">House lights</h1>
      {overview.upcoming && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <img src={overview.upcoming.posterUrl} alt="" className="h-52 w-full object-cover" />
          <div className="p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Upcoming premiere</p>
            <p className="display mt-1 text-2xl">{overview.upcoming.title}</p>
            <p className="text-gold-soft">
              <Countdown iso={overview.upcoming.scheduledAt} />
            </p>
          </div>
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Tickets sold" value={String(overview.ticketsSold)} />
        <Stat label="Gross" value={formatMoney(overview.grossRevenueCents)} />
        <Stat label="Your earnings" value={formatMoney(overview.estimatedEarningsCents)} />
        <Stat label="Viewers" value={String(overview.viewers)} />
      </div>
      <div className="mt-8 space-y-3">
        {overview.premieres.map((premiere) => (
          <Link key={premiere.id} href={`/producer/premieres/${premiere.id}`} className="flex gap-4">
            <img src={premiere.posterUrl} alt="" className="h-20 w-16 rounded-xl object-cover" />
            <div>
              <p className="display text-lg">{premiere.title}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {premiere.status.replaceAll("_", " ")} · {premiere.ticketsSold}{" "}
                {premiere.ticketsSold === 1 ? "ticket" : "tickets"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PhoneShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#121218] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl text-cream">{value}</p>
    </div>
  );
}
