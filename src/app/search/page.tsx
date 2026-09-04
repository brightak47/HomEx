import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listDiscoverPremieres } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { formatMoney } from "@/lib/money";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; country?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/");
  const filters = await searchParams;
  const premieres = await listDiscoverPremieres(filters, user.id);

  return (
    <PhoneShell role={user.role}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Search</p>
      <h1 className="display mt-2 text-4xl">Find a premiere</h1>
      <form className="mt-5 space-y-3">
        <input className="field" name="q" defaultValue={filters.q} placeholder="Title" />
        <div className="grid grid-cols-2 gap-3">
          <input className="field" name="genre" defaultValue={filters.genre} placeholder="Genre" />
          <input className="field" name="country" defaultValue={filters.country} placeholder="Country" />
        </div>
        <button className="gold-btn w-full py-3">Search</button>
      </form>
      <div className="mt-6 space-y-4">
        {premieres.map((premiere) => (
          <Link key={premiere.id} href={`/movies/${premiere.id}`} className="flex gap-4">
            <img src={premiere.posterUrl} alt="" className="h-24 w-16 rounded-xl object-cover" />
            <div>
              <p className="display text-xl">{premiere.title}</p>
              <p className="text-sm text-muted">{premiere.genre} · {premiere.country}</p>
              <p className="text-gold">{formatMoney(premiere.ticketPriceCents, premiere.currency)}</p>
            </div>
          </Link>
        ))}
      </div>
    </PhoneShell>
  );
}
