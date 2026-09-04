import { z } from "zod";
import { jsonError, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { listDiscoverPremieres } from "@/lib/premieres";
import { writeAudit } from "@/lib/audit";
import { parsePriceToCents } from "@/lib/money";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(8),
  genre: z.string().min(2),
  runtimeMinutes: z.number().int().positive(),
  posterUrl: z.string().min(4),
  trailerUrl: z.string().min(4),
  movieAssetUrl: z.string().min(4),
  director: z.string().min(2),
  country: z.string().default("US"),
  scheduledAt: z.string(),
  timezone: z.string().default("America/New_York"),
  durationMinutes: z.number().int().positive(),
  ticketPrice: z.union([z.string(), z.number()]),
  currency: z.string().default("USD"),
  cast: z
    .array(z.object({ name: z.string(), role: z.string(), imageUrl: z.string().optional() }))
    .default([]),
  guests: z
    .array(z.object({ name: z.string(), email: z.string().email(), guestRole: z.string() }))
    .default([]),
  publish: z.boolean().default(false),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const premieres = await listDiscoverPremieres({
    genre: url.searchParams.get("genre") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return Response.json({ premieres });
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("PRODUCER", "ADMIN");
    const body = createSchema.parse(await request.json());
    const ticketPriceCents = parsePriceToCents(body.ticketPrice);

    const movie = await db.movie.create({
      data: {
        title: body.title,
        description: body.description,
        genre: body.genre,
        runtimeMinutes: body.runtimeMinutes,
        posterUrl: body.posterUrl,
        trailerUrl: body.trailerUrl,
        movieAssetUrl: body.movieAssetUrl,
        director: body.director,
        country: body.country,
        castMembers: {
          create: body.cast.map((member) => ({
            name: member.name,
            role: member.role,
            imageUrl: member.imageUrl,
          })),
        },
      },
    });

    const premiere = await db.premiere.create({
      data: {
        producerId: user.id,
        movieId: movie.id,
        scheduledAt: new Date(body.scheduledAt),
        timezone: body.timezone,
        durationMinutes: body.durationMinutes,
        ticketPriceCents,
        currency: body.currency,
        status: body.publish ? "TICKETS_ON_SALE" : "DRAFT",
        publishedAt: body.publish ? new Date() : null,
        invitations: {
          create: body.guests.map((guest) => ({
            name: guest.name,
            email: guest.email.toLowerCase(),
            guestRole: guest.guestRole,
            token: crypto.randomUUID().replace(/-/g, ""),
          })),
        },
      },
      include: { movie: true, invitations: true },
    });

    await writeAudit({
      actorId: user.id,
      action: body.publish ? "premiere.published" : "premiere.created",
      target: premiere.id,
    });

    return Response.json({ premiere });
  } catch (error) {
    return jsonError(error);
  }
}
