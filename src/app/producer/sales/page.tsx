import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { producerOverview } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { formatMoney } from "@/lib/money";

export default async function SalesPage() {
  const user = await getSession();
  if (!user || (user.role !== "PRODUCER" && user.role !== "ADMIN")) redirect("/");
  const overview = await producerOverview(user.id);

  return (
    <PhoneShell role="PRODUCER">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Sales</p>
      <h1 className="display mt-2 text-4xl">The house take</h1>
      <div className="mt-6 rounded-3xl border border-white/10 bg-[#121218] p-5">
        <p className="text-muted">Gross merchandise value</p>
        <p className="display mt-2 text-4xl text-gold">{formatMoney(overview.grossRevenueCents)}</p>
        <p className="mt-4 text-sm text-cream/70">
          Estimated earnings after HomEx commission: {formatMoney(overview.estimatedEarningsCents)}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        {overview.premieres.map((premiere) => (
          <div key={premiere.id} className="rounded-2xl border border-white/10 p-4">
            <p className="display text-xl">{premiere.title}</p>
            <p className="mt-1 text-sm text-muted">
              {premiere.ticketsSold} tickets · {formatMoney(premiere.grossCents)} gross ·{" "}
              {formatMoney(premiere.earningsCents)} yours
            </p>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
