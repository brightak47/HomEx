import type { WatchPartyGrant } from "./types";

export function issueWatchPartyGrant(input: {
  premiereId: string;
  userId: string;
  canPublish: boolean;
}): WatchPartyGrant {
  if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_URL) {
    return {
      provider: "livekit",
      roomName: `premiere_${input.premiereId}`,
      wsUrl: process.env.LIVEKIT_URL,
      canPublish: input.canPublish,
    };
  }

  return {
    provider: "local",
    roomName: `premiere_${input.premiereId}`,
    canPublish: input.canPublish,
  };
}
