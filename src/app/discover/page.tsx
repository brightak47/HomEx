import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listDiscoverPremieres } from "@/lib/premieres";
import { PhoneShell } from "@/components/shell";
import { SwipeDeck } from "@/components/swipe-deck";

export default async function DiscoverPage() {
  const user = await getSession();
  if (!user) redirect("/");
  const premieres = await listDiscoverPremieres(undefined, user.id);
  return (
    <PhoneShell role={user.role} hideNav={false}>
      <SwipeDeck premieres={premieres} />
    </PhoneShell>
  );
}
