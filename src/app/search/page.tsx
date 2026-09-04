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
  const country = filters.country ?? "GH";
  const premieres = await listDiscoverPremieres(
    { ...filters, country: country || undefined },
    user.id,
  );
  const chips = [
    { label: "Ghana", value: "GH" },
    { label: "All", value: "" },
    { label: "US", value: "US" },
    { label: "UK", value: "GB" },
  ];

  return (
    <PhoneShell role={user.role}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Search</p>
      <h1 className="display mt-2 text-4xl">Find a premiere</h1>
      <form className="mt-5 space-y-3">
        <input className="field" name="q" defaultValue={filters.q} placeholder="Title" />
        <div className="grid grid-cols-2 gap-3">
          <input className="field" name="genre" defaultValue={filters.genre} placeholder="Genre" />
          <input className="field" name="country" defaultValue={country} placeholder="Country" />
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const params = new URLSearchParams();
            if (filters.q) params.set("q", filters.q);
            if (filters.genre) params.set("genre", filters.genre);
            if (chip.value) params.set("country", chip.value);
            const href = params.toString() ? `/search?${params}` : "/search?country=";
            const active = country === chip.value;
            return (
              <Link
                key={chip.label}
                href={href}
                className={active ? "gold-btn px-3 py-1 text-xs" : "ghost-btn px-3 py-1 text-xs"}
              >
                {chip.label}
              </Link>
            );
          })}
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
