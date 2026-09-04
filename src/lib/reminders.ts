import { db } from "./db";
import { notifyUser, type NotificationType } from "./adapters/notifications";
import { resolvePremiereStatus } from "./lifecycle";

const windows: {
  type: NotificationType;
  title: string;
  body: (title: string) => string;
  match: (msUntil: number, status: string) => boolean;
}[] = [
  {
    type: "PREMIERE_REMINDER_24H",
    title: "Premiere tomorrow",
    body: (title) => `${title} starts in 24 hours. Keep your ticket ready.`,
    match: (ms) => ms <= 24 * 60 * 60_000 && ms > 60 * 60_000,
  },
  {
    type: "PREMIERE_REMINDER_1H",
    title: "One hour to showtime",
    body: (title) => `${title} begins in about an hour.`,
    match: (ms) => ms <= 60 * 60_000 && ms > 15 * 60_000,
  },
  {
    type: "PREMIERE_REMINDER_15M",
    title: "15 minutes",
    body: (title) => `Doors open soon for ${title}.`,
    match: (ms) => ms <= 15 * 60_000 && ms > 0,
  },
  {
    type: "PREMIERE_STARTING",
    title: "Premiere starting",
    body: (title) => `${title} is starting. Take your seat.`,
    match: (ms, status) => status === "LIVE" || (status === "STARTING_SOON" && ms <= 2 * 60_000),
  },
  {
    type: "POST_PREMIERE",
    title: "Thanks for coming",
    body: (title) => `${title} has ended. The cast Q&A may still be open.`,
    match: (_ms, status) => status === "ENDED",
  },
];

export async function dispatchReminders(now = new Date()) {
  const premieres = await db.premiere.findMany({
    where: { publishedAt: { not: null }, suspended: false },
    include: { movie: true, tickets: { where: { status: { in: ["PAID", "USED"] } } } },
  });

  let sent = 0;
  for (const premiere of premieres) {
    const status = resolvePremiereStatus({ ...premiere, now });
    const msUntil = premiere.scheduledAt.getTime() - now.getTime();
    for (const rule of windows) {
      if (!rule.match(msUntil, status)) continue;
      for (const ticket of premiere.tickets) {
        const existing = await db.notification.findFirst({
          where: {
            userId: ticket.userId,
            premiereId: premiere.id,
            type: rule.type,
          },
        });
        if (existing) continue;
        await notifyUser({
          userId: ticket.userId,
          premiereId: premiere.id,
          type: rule.type,
          title: rule.title,
          body: rule.body(premiere.movie.title),
        });
        sent += 1;
      }
    }
  }
  return sent;
}

export function reminderDue(
  type: NotificationType,
  msUntil: number,
  status: string,
) {
  return windows.find((rule) => rule.type === type)?.match(msUntil, status) ?? false;
}
