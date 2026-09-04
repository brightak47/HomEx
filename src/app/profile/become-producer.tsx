"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function BecomeProducerButton() {
  const router = useRouter();
  return (
    <button
      className="gold-btn px-5 py-2 text-sm"
      onClick={async () => {
        await api("/api/profile/producer", { method: "POST", body: JSON.stringify({}) });
        router.push("/producer");
        router.refresh();
      }}
    >
      Become a producer
    </button>
  );
}
