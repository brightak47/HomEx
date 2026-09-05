import { jsonError, getSession } from "@/lib/auth";
import { getPremiereForUser, getSettings } from "@/lib/premieres";
import { asCommissionConfig, estimateEarnings } from "@/lib/commission";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    const result = await getPremiereForUser(id, session?.id);
    if (!result) return Response.json({ error: "Premiere not found" }, { status: 404 });

    const settings = await getSettings();
    return Response.json({
      premiere: result.dto,
      earnings: estimateEarnings(
        result.dto.ticketPriceCents,
        result.dto.attendeeCount ?? 0,
        asCommissionConfig(settings),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
