"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function StartPremiereButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="gold-btn flex-1 py-3"
      onClick={async () => {
        await api(`/api/premieres/${id}/playback/control`, {
          method: "POST",
          body: JSON.stringify({ action: "start" }),
        });
        router.push(`/premiere/${id}`);
      }}
    >
      Start premiere
    </button>
  );
}
