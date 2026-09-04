import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPremiereForUser } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { Countdown, formatShowtime } from "@/components/countdown";

export default async function TicketConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/");
  const { id } = await params;
  const result = await getPremiereForUser(id, user.id);
  if (!result) notFound();
  const premiere = result.dto;

  return (
    <PhoneShell role={user.role}>
      <div className="px-6 pt-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Ticket confirmed</p>
        <h1 className="display mt-3 text-4xl">{premiere.title}</h1>
        <img src={premiere.posterUrl} alt="" className="mx-auto mt-8 h-72 w-full rounded-3xl object-cover" />
        <p className="mt-6 text-sm text-cream/75">
          Premieres {formatShowtime(premiere.scheduledAt, premiere.timezone)}
        </p>
        <p className="mt-2 text-3xl">
          <Countdown iso={premiere.scheduledAt} />
        </p>
        <Link
          href={premiere.canJoin ? `/premiere/${premiere.id}` : "/tickets"}
          className="gold-btn mt-8 inline-block px-8 py-3"
        >
          {premiere.canJoin ? "Join Premiere" : "View My Tickets"}
        </Link>
      </div>
    </PhoneShell>
  );
}
