"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PhoneShell } from "@/components/shell";

export default function GuestInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<{
    title: string;
    posterUrl: string;
    guestRole: string;
    name: string;
    status: string;
    premiereId: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ invitation: typeof invite }>(`/api/invites/${token}`).then((data) => setInvite(data.invitation));
  }, [token]);

  if (!invite) return <PhoneShell hideNav><div className="p-8 text-muted">Opening invitation…</div></PhoneShell>;

  return (
    <PhoneShell hideNav>
      <img src={invite.posterUrl} alt="" className="h-72 w-full object-cover" />
      <div className="px-5 pt-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">You&apos;re invited</p>
        <h1 className="display mt-2 text-4xl">{invite.title}</h1>
        <p className="mt-3 text-gold-soft">
          Join as {invite.guestRole.toLowerCase()} · {invite.name}
        </p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          className="gold-btn mt-6 w-full py-3"
          onClick={async () => {
            try {
              const result = await api<{ premiereId: string }>(`/api/invites/${token}`, { method: "POST" });
              router.push(`/guest/premiere/${result.premiereId}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Sign in to accept");
              router.push("/");
            }
          }}
        >
          Accept invitation
        </button>
      </div>
    </PhoneShell>
  );
}
