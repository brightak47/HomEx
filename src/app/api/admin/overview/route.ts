import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePremiereStatus } from "@/lib/lifecycle";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const [users, producers, premieres, tickets, transactions] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "PRODUCER" } }),
      db.premiere.findMany({ include: { movie: true } }),
      db.ticket.findMany(),
      db.transaction.findMany(),
    ]);

    const live = premieres.filter((premiere) => resolvePremiereStatus(premiere) === "LIVE").length;
    const upcoming = premieres.filter((premiere) =>
      ["TICKETS_ON_SALE", "STARTING_SOON", "SCHEDULED"].includes(resolvePremiereStatus(premiere)),
    ).length;
    const gmv = tickets.reduce((sum, ticket) => sum + ticket.priceCents, 0);
    const platform = transactions
      .filter((row) => row.type === "PLATFORM_COMMISSION")
      .reduce((sum, row) => sum + row.amountCents, 0);
    const payouts = transactions
      .filter((row) => row.type === "PRODUCER_EARNINGS")
      .reduce((sum, row) => sum + row.amountCents, 0);
    const refunds = tickets.filter((ticket) => ticket.status === "REFUNDED").length;

    return Response.json({
      totalUsers: users,
      activeProducers: producers,
      upcomingPremieres: upcoming,
      livePremieres: live,
      ticketsSold: tickets.length,
      gmvCents: gmv,
      platformRevenueCents: platform,
      producerPayoutsCents: payouts,
      refunds,
      streamingUsage: tickets.filter((ticket) => ticket.status === "USED").length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
