import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPremiereForUser } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { PremiereRoom } from "@/components/premiere-room";

export default async function GuestPremierePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/");
  const { id } = await params;
  const result = await getPremiereForUser(id, user.id);
  if (!result) notFound();

  return (
    <PhoneShell role={user.role} hideNav>
      <PremiereRoom
        premiereId={id}
        title={result.dto.title}
        posterUrl={result.dto.posterUrl}
        scheduledAt={result.dto.scheduledAt}
        guests={result.dto.guests}
        canControl={user.role === "CELEBRITY" || user.role === "PRODUCER" || user.role === "ADMIN"}
      />
    </PhoneShell>
  );
}
