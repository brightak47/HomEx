import { z } from "zod";
import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const since = new Date(Date.now() - 12_000);
  const reactions = await db.reaction.findMany({
    where: { premiereId: id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return Response.json({ reactions });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const { emoji } = z.object({ emoji: z.string().min(1).max(8) }).parse(await request.json());
    const reaction = await db.reaction.create({
      data: { premiereId: id, userId: user.id, emoji },
    });
    return Response.json({ reaction });
  } catch (error) {
    return jsonError(error);
  }
}
