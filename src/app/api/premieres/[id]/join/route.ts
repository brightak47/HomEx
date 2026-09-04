import { jsonError, requireUser } from "@/lib/auth";
import { issuePlaybackGrant } from "@/lib/adapters/video";
import { issueWatchPartyGrant } from "@/lib/adapters/watch-party";
import { openPlaybackSession } from "@/lib/playback";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { deviceId?: string };
    const deviceId = body.deviceId || `dev_${crypto.randomUUID().slice(0, 12)}`;

    const opened = await openPlaybackSession({
      userId: user.id,
      premiereId: id,
      deviceId,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const canPublish =
      user.role === "PRODUCER" ||
      user.role === "CELEBRITY" ||
      user.role === "ADMIN" ||
      opened.premiere.producerId === user.id;

    const playback = await issuePlaybackGrant({
      premiereId: id,
      userId: user.id,
      ticketId: opened.ticket.id,
      sessionId: opened.session.id,
      assetUrl: opened.premiere.movie.movieAssetUrl,
      muxPlaybackId: opened.premiere.movie.muxAssetId,
    });

    return Response.json({
      sessionId: opened.session.id,
      ticketId: opened.ticket.id,
      status: opened.status,
      phase: opened.phase,
      positionMs: opened.positionMs,
      isPaused: opened.premiere.isPaused,
      watermark: opened.watermark,
      playback,
      watchParty: issueWatchPartyGrant({
        premiereId: id,
        userId: user.id,
        canPublish,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
