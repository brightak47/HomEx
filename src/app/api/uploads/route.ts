import { jsonError, requireRole } from "@/lib/auth";
import { saveLocalUpload } from "@/lib/adapters/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const limited = rateLimit(`upload:${user.id}`, 20, 60_000);
    if (!limited.ok) return Response.json({ error: "Too many uploads" }, { status: 429 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Choose a file" }, { status: 400 });
    }
    const stored = await saveLocalUpload(file);
    return Response.json(stored);
  } catch (error) {
    return jsonError(error);
  }
}
