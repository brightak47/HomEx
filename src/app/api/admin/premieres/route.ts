import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolvePremiereStatus } from "@/lib/lifecycle";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const premieres = await db.premiere.findMany({
      include: { movie: true, producer: true, _count: { select: { tickets: true } } },
      orderBy: { scheduledAt: "desc" },
    });
    return Response.json({
      premieres: premieres.map((premiere) => ({
        id: premiere.id,
        title: premiere.movie.title,
        producer: premiere.producer.name,
        scheduledAt: premiere.scheduledAt,
        status: resolvePremiereStatus(premiere),
        ticketsSold: premiere._count.tickets,
        suspended: premiere.suspended,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = z
      .object({ premiereId: z.string(), suspended: z.boolean() })
      .parse(await request.json());
    const premiere = await db.premiere.update({
      where: { id: body.premiereId },
      data: { suspended: body.suspended },
    });
    await writeAudit({
      actorId: admin.id,
      action: body.suspended ? "premiere.suspended" : "premiere.restored",
      target: premiere.id,
    });
    return Response.json({ premiere });
  } catch (error) {
    return jsonError(error);
  }
}
