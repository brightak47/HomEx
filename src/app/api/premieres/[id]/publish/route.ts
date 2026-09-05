import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const { id } = await context.params;
    const premiere = await db.premiere.findUnique({ where: { id } });
    if (!premiere) return Response.json({ error: "Premiere not found" }, { status: 404 });
    if (user.role !== "ADMIN" && premiere.producerId !== user.id) {
      return Response.json({ error: "Not your premiere" }, { status: 403 });
    }

    const updated = await db.premiere.update({
      where: { id },
      data: { status: "TICKETS_ON_SALE", publishedAt: new Date() },
    });
    await writeAudit({ actorId: user.id, action: "premiere.published", target: id });
    return Response.json({ premiere: updated });
  } catch (error) {
    return jsonError(error);
  }
}
