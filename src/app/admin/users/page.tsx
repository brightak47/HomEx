"use client";

import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell";
import { api } from "@/lib/api";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ users: Row[] }>("/api/admin/users");
    setUsers(data.users);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <PhoneShell role="ADMIN">
      <p className="text-[11px] uppercase tracking-[0.24em] text-gold">People</p>
      <h1 className="display mt-2 text-4xl">Users & producers</h1>
      <div className="mt-6 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-2xl border border-white/10 p-4">
            <p className="display text-xl">{user.name}</p>
            <p className="text-sm text-muted">{user.email} · {user.role}</p>
            <button
              className="ghost-btn mt-3 px-4 py-2 text-xs uppercase tracking-[0.16em]"
              onClick={async () => {
                await api("/api/admin/users", {
                  method: "POST",
                  body: JSON.stringify({ userId: user.id, suspended: !user.suspended }),
                });
                void load();
              }}
            >
              {user.suspended ? "Reinstate" : "Suspend"}
            </button>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
