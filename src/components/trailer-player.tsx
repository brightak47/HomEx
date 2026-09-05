"use client";

import { youtubeEmbedUrl } from "@/lib/youtube";

export function TrailerPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  className = "",
}: {
  src: string;
  poster?: string | null;
  title: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
}) {
  const embed = youtubeEmbedUrl(src, { autoplay: autoPlay, muted, loop, controls });

  if (embed) {
    return (
      <iframe
        src={embed}
        title={`${title} trailer`}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={src}
      poster={poster ?? undefined}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
    />
  );
}
