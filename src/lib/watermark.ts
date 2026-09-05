export function buildWatermark(input: {
  userId: string;
  ticketId: string;
  sessionId: string;
  timestamp?: Date;
}) {
  const timestamp = (input.timestamp ?? new Date()).toISOString();
  return {
    userFragment: input.userId.slice(-6).toUpperCase(),
    ticketFragment: input.ticketId.slice(-8).toUpperCase(),
    sessionFragment: input.sessionId.slice(-6).toUpperCase(),
    timestamp,
    label: `${input.userId.slice(-6)} · ${input.ticketId.slice(-8)} · ${input.sessionId.slice(-6)}`,
  };
}

export function newDeviceId(): string {
  return `dev_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
