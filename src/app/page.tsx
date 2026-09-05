"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const demos = [
  { role: "Viewer", email: "viewer@homex.app" },
  { role: "Producer", email: "producer@homex.app" },
  { role: "Celebrity", email: "celebrity@homex.app" },
  { role: "Admin", email: "admin@homex.app" },
];

function homeFor(role: string) {
  if (role === "PRODUCER") return "/producer";
  if (role === "ADMIN") return "/admin";
  if (role === "CELEBRITY") return "/tickets";
  return "/discover";
}

export default function SplashPage() {
  const router = useRouter();
  const [email, setEmail] = useState("viewer@homex.app");
  const [password, setPassword] = useState("homex123");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [producer, setProducer] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = await api<{ user: { role: string } }>(path, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: name || email.split("@")[0],
          role: producer ? "PRODUCER" : "VIEWER",
          studioName: producer ? `${name || "New"} Studio` : undefined,
        }),
      });
      router.push(homeFor(payload.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="phone-shell">
      <div className="relative min-h-[100dvh]">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#070709]" />
        <div className="relative flex min-h-[100dvh] flex-col justify-end px-6 pb-10">
          <p className="display text-sm tracking-[0.42em] text-gold">HOMEX</p>
          <h1 className="display mt-3 text-5xl leading-tight text-cream">The premiere comes home.</h1>
          <p className="mt-3 max-w-sm text-sm text-cream/75">
            Discover films, buy a seat, and watch live with the cast.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {demos.map((demo) => (
              <button
                key={demo.email}
                className="ghost-btn px-3 py-2 text-xs uppercase tracking-[0.16em]"
                onClick={() => {
                  setEmail(demo.email);
                  setPassword("homex123");
                  setMode("login");
                }}
              >
                {demo.role}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {mode === "register" && (
              <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className="field"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={producer} onChange={(e) => setProducer(e.target.checked)} />
                Become a producer
              </label>
            )}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button className="gold-btn w-full py-3" disabled={busy} onClick={() => void submit()}>
              {busy ? "Opening the house…" : mode === "login" ? "Enter HomEx" : "Create account"}
            </button>
            <button
              className="w-full text-sm text-muted"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "New here? Create an account" : "Already have a seat? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
