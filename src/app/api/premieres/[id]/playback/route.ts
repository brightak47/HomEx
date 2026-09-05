import { jsonError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { officialPlaybackPositionMs, resolvePremierePhase, resolvePremiereStatus } from "@/lib/lifecycle";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await context.params;
    const premiere = await db.premiere.findUnique({ where: { id } });
    if (!premiere) return Response.json({ error: "Premiere not found" }, { status: 404 });
    return Response.json({
      status: resolvePremiereStatus(premiere),
      phase: resolvePremierePhase(premiere),
      positionMs: officialPlaybackPositionMs(premiere),
      isPaused: premiere.isPaused,
      scheduledAt: premiere.scheduledAt,
    });
  } catch (error) {
    return jsonError(error);
  }
}
