import { jsonError, requireRole } from "@/lib/auth";
import { producerOverview } from "@/lib/premieres";

export async function GET() {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const overview = await producerOverview(user.id);
    return Response.json(overview);
  } catch (error) {
    return jsonError(error);
  }
}
