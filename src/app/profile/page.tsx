import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PhoneShell } from "@/components/shell";
import { LogoutButton } from "./logout-button";
import { BecomeProducerButton } from "./become-producer";

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/");
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <PhoneShell role={user.role}>
      <div className="px-5 pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{user.role}</p>
        <h1 className="display mt-2 text-4xl">{user.name}</h1>
        <p className="mt-2 text-muted">{user.email}</p>
        {user.role === "VIEWER" && <BecomeProducerButton />}
        <LogoutButton />
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Notifications</p>
          <div className="mt-3 space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-gold-soft">{item.title}</p>
                <p className="mt-1 text-sm text-cream/75">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
