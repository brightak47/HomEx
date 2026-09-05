import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPremiereForUser } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { formatMoney } from "@/lib/money";
import { GuestInviteForm } from "./guest-form";
import { StartPremiereButton } from "./start-button";

export default async function ProducerPremierePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user || (user.role !== "PRODUCER" && user.role !== "ADMIN")) redirect("/");
  const { id } = await params;
  const result = await getPremiereForUser(id, user.id);
  if (!result) notFound();
  const invitations = await db.guestInvitation.findMany({ where: { premiereId: id } });
  const tickets = await db.ticket.findMany({ where: { premiereId: id } });
  const gross = tickets.reduce((sum, ticket) => sum + ticket.priceCents, 0);
  const earnings = tickets.reduce((sum, ticket) => sum + ticket.producerEarningsCents, 0);

  return (
    <PhoneShell role="PRODUCER">
      <img src={result.dto.posterUrl} alt="" className="h-56 w-full rounded-3xl object-cover" />
      <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-gold">
        {result.dto.status.replaceAll("_", " ")}
      </p>
      <h1 className="display mt-2 text-4xl">{result.dto.title}</h1>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Tickets" value={String(tickets.length)} />
        <Stat label="Gross" value={formatMoney(gross)} />
        <Stat label="Yours" value={formatMoney(earnings)} />
      </div>
      <div className="mt-6 flex gap-3">
        <StartPremiereButton id={id} />
        <Link href={`/premiere/${id}`} className="ghost-btn flex-1 py-3 text-center">
          Open room
        </Link>
      </div>
      <div className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Guests</p>
        <div className="mt-3 space-y-2">
          {invitations.map((invite) => (
            <div key={invite.id} className="rounded-2xl border border-white/10 p-3 text-sm">
              <p>{invite.name} · {invite.guestRole}</p>
              <p className="text-muted">{invite.status} · {invite.email}</p>
              <p className="mt-1 text-xs text-gold-soft">/guest/invite/{invite.token}</p>
            </div>
          ))}
        </div>
        <GuestInviteForm premiereId={id} />
      </div>
    </PhoneShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
    </div>
  );
}
