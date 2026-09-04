"use client";

import { useState } from "react";

export function FileUpload({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: data });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Upload failed");
      onChange(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block space-y-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <input
        type="file"
        accept={accept}
        className="field"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <input
        className="field"
        placeholder="Or paste a URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {busy && <p className="text-xs text-gold-soft">Uploading…</p>}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </label>
  );
}
