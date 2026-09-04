import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePremiereStatus } from "@/lib/lifecycle";
import { PhoneShell } from "@/components/shell";
import { formatMoney } from "@/lib/money";

export default async function AdminPage() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/");

  const [users, producers, premieres, tickets, transactions] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "PRODUCER" } }),
    db.premiere.findMany(),
    db.ticket.findMany(),
    db.transaction.findMany(),
  ]);

  const live = premieres.filter((premiere) => resolvePremiereStatus(premiere) === "LIVE").length;
  const upcoming = premieres.filter((premiere) =>
    ["TICKETS_ON_SALE", "STARTING_SOON", "SCHEDULED"].includes(resolvePremiereStatus(premiere)),
  ).length;
  const gmv = tickets.reduce((sum, ticket) => sum + ticket.priceCents, 0);
  const platform = transactions
    .filter((row) => row.type === "PLATFORM_COMMISSION")
    .reduce((sum, row) => sum + row.amountCents, 0);

  return (
    <PhoneShell role="ADMIN">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Admin</p>
      <h1 className="display mt-2 text-4xl">The house</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Users" value={String(users)} />
        <Stat label="Producers" value={String(producers)} />
        <Stat label="Upcoming" value={String(upcoming)} />
        <Stat label="Live now" value={String(live)} />
        <Stat label="Tickets" value={String(tickets.length)} />
        <Stat label="GMV" value={formatMoney(gmv)} />
        <Stat label="HomEx revenue" value={formatMoney(platform)} />
        <Stat label="Refunds" value={String(tickets.filter((t) => t.status === "REFUNDED").length)} />
      </div>
    </PhoneShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#121218] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl">{value}</p>
    </div>
  );
}
