import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["start", "pause", "resume", "end", "seek"]),
  positionMs: z.number().int().nonnegative().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const premiere = await db.premiere.findUnique({ where: { id } });
    if (!premiere) return Response.json({ error: "Premiere not found" }, { status: 404 });
    if (user.role !== "ADMIN" && premiere.producerId !== user.id) {
      return Response.json({ error: "Not your premiere" }, { status: 403 });
    }

    const now = new Date();
    const data: Record<string, unknown> = {};
    if (body.action === "start") {
      data.status = "LIVE";
      data.phase = "MOVIE";
      data.playbackStartedAt = now;
      data.isPaused = false;
      data.playbackPositionMs = 0;
    } else if (body.action === "pause") {
      data.isPaused = true;
      data.playbackPositionMs = body.positionMs ?? premiere.playbackPositionMs;
    } else if (body.action === "resume") {
      data.isPaused = false;
      data.playbackStartedAt = new Date(
        now.getTime() - (body.positionMs ?? premiere.playbackPositionMs),
      );
    } else if (body.action === "seek") {
      data.playbackPositionMs = body.positionMs ?? 0;
      data.playbackStartedAt = new Date(now.getTime() - (body.positionMs ?? 0));
    } else if (body.action === "end") {
      data.status = "ENDED";
      data.phase = "AFTER_SHOW";
      data.isPaused = true;
    }

    const updated = await db.premiere.update({ where: { id }, data });
    await writeAudit({
      actorId: user.id,
      action: `playback.${body.action}`,
      target: id,
      meta: body,
    });
    return Response.json({ premiere: updated });
  } catch (error) {
    return jsonError(error);
  }
}
