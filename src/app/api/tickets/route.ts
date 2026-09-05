import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePremiereStatus } from "@/lib/lifecycle";

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await db.ticket.findMany({
      where: { userId: user.id },
      include: {
        premiere: { include: { movie: true } },
      },
      orderBy: { purchasedAt: "desc" },
    });
    return Response.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        status: ticket.status,
        priceCents: ticket.priceCents,
        purchasedAt: ticket.purchasedAt,
        premiereId: ticket.premiereId,
        title: ticket.premiere.movie.title,
        posterUrl: ticket.premiere.movie.posterUrl,
        scheduledAt: ticket.premiere.scheduledAt,
        premiereStatus: resolvePremiereStatus(ticket.premiere),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
