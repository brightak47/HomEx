import { db } from "./db";
import { asCommissionConfig, estimateEarnings, splitRevenue } from "./commission";
import {
  canBuyTicket,
  canJoinPremiere,
  officialPlaybackPositionMs,
  resolvePremierePhase,
  resolvePremiereStatus,
  type PremiereStatus,
} from "./lifecycle";
import { notifyTicketPurchase } from "./adapters/notifications";
import { writeAudit } from "./audit";
import { dispatchReminders } from "./reminders";

export async function getSettings() {
  return db.platformSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });
}

export function serializePremiere<
  T extends {
    id: string;
    status: string;
    scheduledAt: Date;
    durationMinutes: number;
    preShowMinutes: number;
    publishedAt: Date | null;
    suspended: boolean;
    ticketPriceCents: number;
    currency: string;
    showAttendeeCount: boolean;
    playbackStartedAt: Date | null;
    playbackPositionMs: number;
    isPaused: boolean;
    timezone: string;
    movie: {
      title: string;
      description: string;
      genre: string;
      runtimeMinutes: number;
      posterUrl: string;
      trailerUrl: string;
      director: string;
      country: string;
      castMembers: { id: string; name: string; role: string; imageUrl: string | null }[];
    };
    producer: {
      name: string;
      producerProfile: { studioName: string } | null;
    };
    invitations: {
      name: string;
      guestRole: string;
      status: string;
    }[];
    _count: { tickets: number };
  },
>(premiere: T, ticketStatus?: string | null) {
  const status = resolvePremiereStatus(premiere);
  const phase = resolvePremierePhase(premiere);
  const guests = premiere.invitations.filter((guest) => guest.status === "ACCEPTED");
  return {
    id: premiere.id,
    status,
    phase,
    scheduledAt: premiere.scheduledAt.toISOString(),
    timezone: premiere.timezone,
    durationMinutes: premiere.durationMinutes,
    preShowMinutes: premiere.preShowMinutes,
    ticketPriceCents: premiere.ticketPriceCents,
    currency: premiere.currency,
    showAttendeeCount: premiere.showAttendeeCount,
    attendeeCount: premiere.showAttendeeCount ? premiere._count.tickets : null,
    title: premiere.movie.title,
    description: premiere.movie.description,
    genre: premiere.movie.genre,
    runtimeMinutes: premiere.movie.runtimeMinutes,
    posterUrl: premiere.movie.posterUrl,
    trailerUrl: premiere.movie.trailerUrl,
    director: premiere.movie.director,
    country: premiere.movie.country,
    studioName: premiere.producer.producerProfile?.studioName ?? premiere.producer.name,
    producerName: premiere.producer.name,
    cast: premiere.movie.castMembers,
    guests,
    ticketStatus: ticketStatus ?? null,
    canBuy: canBuyTicket(status) && ticketStatus !== "PAID" && ticketStatus !== "USED",
    canJoin: canJoinPremiere(status) && (ticketStatus === "PAID" || ticketStatus === "USED"),
    playbackPositionMs: officialPlaybackPositionMs(premiere),
  };
}

const premiereInclude = {
  movie: { include: { castMembers: true } },
  producer: { include: { producerProfile: true } },
  invitations: true,
  _count: { select: { tickets: true } },
} as const;

export async function listDiscoverPremieres(
  filters?: {
    genre?: string;
    country?: string;
    q?: string;
  },
  userId?: string,
) {
  const premieres = await db.premiere.findMany({
    where: {
      publishedAt: { not: null },
      suspended: false,
      status: { not: "DRAFT" },
      movie: {
        genre: filters?.genre || undefined,
        country: filters?.country || undefined,
        title: filters?.q ? { contains: filters.q } : undefined,
      },
    },
    include: premiereInclude,
    orderBy: { scheduledAt: "asc" },
  });

  void dispatchReminders().catch(() => undefined);

  const tickets = userId
    ? await db.ticket.findMany({
        where: { userId, status: { in: ["PAID", "USED"] } },
        select: { premiereId: true, status: true },
      })
    : [];
  const ticketByPremiere = new Map(tickets.map((ticket) => [ticket.premiereId, ticket.status]));

  return premieres
    .map((premiere) => serializePremiere(premiere, ticketByPremiere.get(premiere.id)))
    .filter((premiere) =>
      ["TICKETS_ON_SALE", "STARTING_SOON", "LIVE", "SCHEDULED"].includes(premiere.status),
    )
    .sort((a, b) => {
      const rank: Record<string, number> = {
        LIVE: 0,
        STARTING_SOON: 1,
        TICKETS_ON_SALE: 2,
        SCHEDULED: 3,
      };
      const byStatus = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      const ghanaFirst = Number(a.country !== "GH") - Number(b.country !== "GH");
      if (ghanaFirst !== 0) return ghanaFirst;
      return (b.attendeeCount ?? 0) - (a.attendeeCount ?? 0);
    });
}

export async function getPremiereForUser(id: string, userId?: string) {
  const premiere = await db.premiere.findUnique({
    where: { id },
    include: premiereInclude,
  });
  if (!premiere) return null;
  void dispatchReminders().catch(() => undefined);

  const liveStatus = resolvePremiereStatus(premiere);
  if (premiere.status !== liveStatus && premiere.status !== "DRAFT" && premiere.status !== "ARCHIVED") {
    await db.premiere.update({
      where: { id },
      data: { status: liveStatus, phase: resolvePremierePhase(premiere) },
    });
  }

  const ticket = userId
    ? await db.ticket.findFirst({
        where: { premiereId: id, userId, status: { in: ["PAID", "USED"] } },
      })
    : null;

  return {
    raw: premiere,
    dto: serializePremiere(premiere, ticket?.status),
    ticket,
  };
}

export async function completeTicketPurchase(input: {
  orderId: string;
  providerRef?: string;
}) {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { premiere: { include: { movie: true } }, tickets: true, user: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.tickets.length > 0) return order.tickets[0];

  const settings = await getSettings();
  const split = splitRevenue(order.totalCents, asCommissionConfig(settings));

  const ticket = await db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: order.provider,
        providerRef: input.providerRef,
        amountCents: order.totalCents,
        currency: order.currency,
        status: "SUCCEEDED",
      },
    });

    const created = await tx.ticket.create({
      data: {
        userId: order.userId,
        premiereId: order.premiereId,
        orderId: order.id,
        paymentId: payment.id,
        priceCents: split.priceCents,
        commissionCents: split.commissionCents,
        producerEarningsCents: split.producerEarningsCents,
        status: "PAID",
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", providerRef: input.providerRef },
    });

    await tx.transaction.createMany({
      data: [
        {
          type: "TICKET_SALE",
          amountCents: split.priceCents,
          currency: order.currency,
          premiereId: order.premiereId,
          ticketId: created.id,
          producerId: order.premiere.producerId,
          note: "Gross ticket sale",
        },
        {
          type: "PLATFORM_COMMISSION",
          amountCents: split.commissionCents,
          currency: order.currency,
          premiereId: order.premiereId,
          ticketId: created.id,
          producerId: order.premiere.producerId,
          note: "HomEx commission",
        },
        {
          type: "PRODUCER_EARNINGS",
          amountCents: split.producerEarningsCents,
          currency: order.currency,
          premiereId: order.premiereId,
          ticketId: created.id,
          producerId: order.premiere.producerId,
          note: "Producer share",
        },
      ],
    });

    return created;
  });

  await notifyTicketPurchase({
    userId: order.userId,
    premiereId: order.premiereId,
    title: order.premiere.movie.title,
  });

  await writeAudit({
    actorId: order.userId,
    action: "ticket.purchased",
    target: ticket.id,
    meta: { premiereId: order.premiereId, orderId: order.id },
  });

  return ticket;
}

export async function producerOverview(producerId: string) {
  const settings = await getSettings();
  const premieres = await db.premiere.findMany({
    where: { producerId },
    include: {
      movie: true,
      _count: { select: { tickets: true } },
      tickets: { select: { priceCents: true, producerEarningsCents: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const upcoming = premieres.find((premiere) => {
    const status = resolvePremiereStatus(premiere);
    return ["TICKETS_ON_SALE", "STARTING_SOON", "LIVE", "SCHEDULED"].includes(status);
  });

  const ticketsSold = premieres.reduce((sum, premiere) => sum + premiere._count.tickets, 0);
  const gross = premieres.reduce(
    (sum, premiere) =>
      sum + premiere.tickets.reduce((inner, ticket) => inner + ticket.priceCents, 0),
    0,
  );
  const earnings = premieres.reduce(
    (sum, premiere) =>
      sum + premiere.tickets.reduce((inner, ticket) => inner + ticket.producerEarningsCents, 0),
    0,
  );

  return {
    upcoming: upcoming
      ? {
          id: upcoming.id,
          title: upcoming.movie.title,
          posterUrl: upcoming.movie.posterUrl,
          scheduledAt: upcoming.scheduledAt.toISOString(),
          status: resolvePremiereStatus(upcoming),
          ticketsSold: upcoming._count.tickets,
        }
      : null,
    ticketsSold,
    grossRevenueCents: gross,
    estimatedEarningsCents: earnings,
    viewers: ticketsSold,
    settings,
    estimate: upcoming
      ? estimateEarnings(
          upcoming.ticketPriceCents,
          upcoming._count.tickets || 1,
          asCommissionConfig(settings),
        )
      : null,
    premieres: premieres.map((premiere) => ({
      id: premiere.id,
      title: premiere.movie.title,
      posterUrl: premiere.movie.posterUrl,
      scheduledAt: premiere.scheduledAt.toISOString(),
      status: resolvePremiereStatus(premiere),
      ticketsSold: premiere._count.tickets,
      grossCents: premiere.tickets.reduce((sum, ticket) => sum + ticket.priceCents, 0),
      earningsCents: premiere.tickets.reduce(
        (sum, ticket) => sum + ticket.producerEarningsCents,
        0,
      ),
    })),
  };
}

export function assertStatus(status: PremiereStatus | string, allowed: PremiereStatus[]) {
  if (!allowed.includes(status as PremiereStatus)) {
    const error = new Error("Premiere is not available for this action");
    (error as Error & { status: number }).status = 409;
    throw error;
  }
}
