export const PREMIERE_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "TICKETS_ON_SALE",
  "STARTING_SOON",
  "LIVE",
  "ENDED",
  "ARCHIVED",
] as const;

export type PremiereStatus = (typeof PREMIERE_STATUSES)[number];
export type PremierePhase = "PRE_SHOW" | "MOVIE" | "AFTER_SHOW" | "ENDED";

export type PremiereClock = {
  status: string;
  scheduledAt: Date;
  durationMinutes: number;
  preShowMinutes: number;
  publishedAt?: Date | null;
  suspended?: boolean;
  now?: Date;
};

export function resolvePremiereStatus(input: PremiereClock): PremiereStatus {
  if (input.status === "DRAFT") return "DRAFT";
  if (input.status === "ARCHIVED") return "ARCHIVED";
  if (input.suspended) return input.status as PremiereStatus;

  const now = input.now ?? new Date();
  const start = new Date(input.scheduledAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const startingSoon = new Date(start.getTime() - input.preShowMinutes * 60_000);

  if (now >= end) return "ENDED";
  if (now >= start) return "LIVE";
  if (now >= startingSoon) return "STARTING_SOON";
  if (input.publishedAt) return "TICKETS_ON_SALE";
  return "SCHEDULED";
}

export function resolvePremierePhase(input: PremiereClock): PremierePhase {
  const now = input.now ?? new Date();
  const start = new Date(input.scheduledAt);
  const movieEnd = new Date(start.getTime() + input.durationMinutes * 60_000);
  const afterShowEnd = new Date(movieEnd.getTime() + 30 * 60_000);
  const preShow = new Date(start.getTime() - input.preShowMinutes * 60_000);

  if (now >= afterShowEnd) return "ENDED";
  if (now >= movieEnd) return "AFTER_SHOW";
  if (now >= start) return "MOVIE";
  if (now >= preShow) return "PRE_SHOW";
  return "PRE_SHOW";
}

export function officialPlaybackPositionMs(input: {
  scheduledAt: Date;
  durationMinutes: number;
  playbackStartedAt?: Date | null;
  playbackPositionMs?: number;
  isPaused?: boolean;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const durationMs = input.durationMinutes * 60_000;
  if (input.isPaused) {
    return Math.min(input.playbackPositionMs ?? 0, durationMs);
  }
  const origin = input.playbackStartedAt ?? input.scheduledAt;
  const elapsed = now.getTime() - new Date(origin).getTime();
  return Math.max(0, Math.min(elapsed, durationMs));
}

export function canJoinPremiere(status: PremiereStatus): boolean {
  return status === "STARTING_SOON" || status === "LIVE";
}

export function canBuyTicket(status: PremiereStatus): boolean {
  return (
    status === "SCHEDULED" ||
    status === "TICKETS_ON_SALE" ||
    status === "STARTING_SOON" ||
    status === "LIVE"
  );
}
