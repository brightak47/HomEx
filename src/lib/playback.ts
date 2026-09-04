import { db } from "./db";
import { writeAudit } from "./audit";
import { getSettings } from "./premieres";
import { buildWatermark } from "./watermark";
import {
  canJoinPremiere,
  officialPlaybackPositionMs,
  resolvePremierePhase,
  resolvePremiereStatus,
} from "./lifecycle";

export async function openPlaybackSession(input: {
  userId: string;
  premiereId: string;
  deviceId: string;
  userAgent?: string;
}) {
  const premiere = await db.premiere.findUnique({
    where: { id: input.premiereId },
    include: { movie: true },
  });
  if (!premiere || premiere.suspended) {
    const error = new Error("Premiere is not available");
    (error as Error & { status: number }).status = 404;
    throw error;
  }

  const status = resolvePremiereStatus(premiere);
  if (!canJoinPremiere(status)) {
    const error = new Error("This premiere is not open yet");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  const user = await db.user.findUnique({ where: { id: input.userId } });
  const invited = user
    ? await db.guestInvitation.findFirst({
        where: { premiereId: input.premiereId, email: user.email, status: "ACCEPTED" },
      })
    : null;
  const isHost =
    user?.role === "ADMIN" || premiere.producerId === input.userId || Boolean(invited);

  let ticket = await db.ticket.findFirst({
    where: {
      premiereId: input.premiereId,
      userId: input.userId,
      status: { in: ["PAID", "USED"] },
    },
  });

  if (!ticket && isHost) {
    const order = await db.order.create({
      data: {
        userId: input.userId,
        premiereId: input.premiereId,
        status: "COMPED",
        totalCents: 0,
        currency: premiere.currency,
        provider: "comp",
      },
    });
    ticket = await db.ticket.create({
      data: {
        userId: input.userId,
        premiereId: input.premiereId,
        orderId: order.id,
        priceCents: 0,
        commissionCents: 0,
        producerEarningsCents: 0,
        status: "PAID",
      },
    });
  }

  if (!ticket) {
    const error = new Error("A valid ticket is required");
    (error as Error & { status: number }).status = 403;
    throw error;
  }

  const settings = await getSettings();
  const active = await db.playbackSession.findMany({
    where: {
      ticketId: ticket.id,
      endedAt: null,
    },
    orderBy: { startedAt: "asc" },
  });

  if (active.length >= settings.maxConcurrentStreams) {
    if (settings.terminatePriorSession) {
      await db.playbackSession.updateMany({
        where: { id: { in: active.map((session) => session.id) } },
        data: { endedAt: new Date(), endReason: "SUPERSEDED" },
      });
    } else {
      const error = new Error("This ticket is already streaming on another device");
      (error as Error & { status: number }).status = 409;
      throw error;
    }
  }

  const session = await db.playbackSession.create({
    data: {
      userId: input.userId,
      ticketId: ticket.id,
      premiereId: input.premiereId,
      deviceId: input.deviceId,
      watermarkSeed: crypto.randomUUID(),
    },
  });

  await db.deviceSession.create({
    data: {
      userId: input.userId,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
    },
  });

  if (ticket.status === "PAID") {
    await db.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED" },
    });
  }

  await writeAudit({
    actorId: input.userId,
    action: "playback.opened",
    target: session.id,
    meta: { premiereId: input.premiereId, ticketId: ticket.id },
  });

  return {
    session,
    ticket,
    premiere,
    status,
    phase: resolvePremierePhase(premiere),
    positionMs: officialPlaybackPositionMs(premiere),
    watermark: buildWatermark({
      userId: input.userId,
      ticketId: ticket.id,
      sessionId: session.id,
    }),
  };
}

export async function heartbeatSession(sessionId: string, userId: string) {
  const session = await db.playbackSession.findFirst({
    where: { id: sessionId, userId, endedAt: null },
  });
  if (!session) {
    const error = new Error("Playback session is no longer active");
    (error as Error & { status: number }).status = 409;
    throw error;
  }
  return db.playbackSession.update({
    where: { id: sessionId },
    data: { lastHeartbeat: new Date() },
  });
}
