import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializePremiere } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { formatMoney } from "@/lib/money";

export default async function SavedPage() {
  const user = await getSession();
  if (!user) redirect("/");
  const saved = await db.savedPremiere.findMany({
    where: { userId: user.id },
    include: {
      premiere: {
        include: {
          movie: { include: { castMembers: true } },
          producer: { include: { producerProfile: true } },
          invitations: true,
          _count: { select: { tickets: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PhoneShell role={user.role}>
      <div className="px-5 pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Saved</p>
        <h1 className="display mt-2 text-4xl">Your reel</h1>
        <div className="mt-6 space-y-4">
          {saved.length === 0 && <p className="text-muted">Swipe right to save a premiere.</p>}
          {saved.map((item) => {
            const premiere = serializePremiere(item.premiere);
            return (
              <Link key={premiere.id} href={`/movies/${premiere.id}`} className="flex gap-4">
                <img src={premiere.posterUrl} alt="" className="h-28 w-20 rounded-2xl object-cover" />
                <div>
                  <p className="display text-xl">{premiere.title}</p>
                  <p className="text-sm text-muted">{premiere.genre}</p>
                  <p className="mt-1 text-gold">{formatMoney(premiere.ticketPriceCents, premiere.currency)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PhoneShell>
  );
}
