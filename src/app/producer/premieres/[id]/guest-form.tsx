"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function GuestInviteForm({ premiereId }: { premiereId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guestRole, setGuestRole] = useState("CELEBRITY");

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await api(`/api/premieres/${premiereId}/guests`, {
          method: "POST",
          body: JSON.stringify({ name, email, guestRole }),
        });
        setName("");
        setEmail("");
        router.refresh();
      }}
    >
      <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select className="field" value={guestRole} onChange={(e) => setGuestRole(e.target.value)}>
        <option>ACTOR</option>
        <option>DIRECTOR</option>
        <option>CELEBRITY</option>
        <option>INFLUENCER</option>
        <option>SPECIAL_GUEST</option>
      </select>
      <button className="gold-btn w-full py-3">Send invitation</button>
    </form>
  );
}
