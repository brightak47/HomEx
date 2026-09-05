import { SignJWT, jwtVerify } from "jose";
import type { VideoPlaybackGrant } from "./types";

function playbackSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "homex-playback");
}

export async function issuePlaybackGrant(input: {
  premiereId: string;
  userId: string;
  ticketId: string;
  sessionId: string;
  assetUrl: string;
  muxPlaybackId?: string | null;
}): Promise<VideoPlaybackGrant> {
  const expiresAt = new Date(Date.now() + 90_000);
  const token = await new SignJWT({
    premiereId: input.premiereId,
    userId: input.userId,
    ticketId: input.ticketId,
    sessionId: input.sessionId,
    assetUrl: input.assetUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90s")
    .setIssuedAt()
    .sign(playbackSecret());

  if (process.env.MUX_TOKEN_ID && input.muxPlaybackId) {
    return {
      provider: "mux",
      playbackUrl: `https://stream.mux.com/${input.muxPlaybackId}.m3u8`,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  return {
    provider: "local",
    playbackUrl: input.assetUrl,
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyPlaybackToken(token: string) {
  const { payload } = await jwtVerify(token, playbackSecret());
  return payload as {
    premiereId: string;
    userId: string;
    ticketId: string;
    sessionId: string;
    assetUrl: string;
  };
}
