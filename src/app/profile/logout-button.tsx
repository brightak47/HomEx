"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="ghost-btn px-5 py-2 text-sm"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
