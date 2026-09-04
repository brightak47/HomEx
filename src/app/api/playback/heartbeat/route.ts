import { z } from "zod";
import { jsonError, requireUser } from "@/lib/auth";
import { heartbeatSession } from "@/lib/playback";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { sessionId } = z.object({ sessionId: z.string() }).parse(await request.json());
    await heartbeatSession(sessionId, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
