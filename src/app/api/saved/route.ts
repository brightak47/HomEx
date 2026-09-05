import { z } from "zod";
import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serializePremiere } from "@/lib/premieres";

export async function GET() {
  try {
    const user = await requireUser();
    const saved = await db.savedPremiere.findMany({
      where: { userId: user.id },
      include: {
        premiere: {
          include: {
            movie: { include: { castMembers: true } },
            producer: { include: { producerProfile: true } },
            invitations: true,
            _count: { select: { tickets: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({
      premieres: saved.map((item) => serializePremiere(item.premiere)),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { premiereId } = z.object({ premiereId: z.string() }).parse(await request.json());
    await db.savedPremiere.upsert({
      where: { userId_premiereId: { userId: user.id, premiereId } },
      update: {},
      create: { userId: user.id, premiereId },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { premiereId } = z.object({ premiereId: z.string() }).parse(await request.json());
    await db.savedPremiere.deleteMany({
      where: { userId: user.id, premiereId },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
