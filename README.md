# HomEx

Mobile-first movie premiere platform: swipe discovery, digital tickets, synchronized playback, and a live watch party.

The product loop is:

**Discover → Trailer → Buy Ticket → Join Premiere → Watch Movie → Watch Party → Producer Gets Paid**

## Demo accounts

Password for all seeded users: `homex123`

| Role | Email |
| --- | --- |
| Viewer | `viewer@homex.app` |
| Producer | `producer@homex.app` |
| Celebrity | `celebrity@homex.app` |
| Admin | `admin@homex.app` |

The viewer already holds a ticket to the live **Neon Harbor** premiere.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js + TypeScript, mobile-first cinematic UI
- Prisma / SQLite for local MVP (Postgres-ready models)
- Adapter layer for Stripe, Mux, LiveKit, email, and notifications
- Signed playback grants, ticket checks, session limits, and forensic watermarks

Without Stripe keys, checkout completes through the demo payment adapter and still writes the ticket + commission ledger. Mux and LiveKit adapters activate when their secrets are present.

Producers can upload a poster, trailer, and movie file, or paste a stream URL. Ticket holders receive 24-hour, 1-hour, 15-minute, starting, and post-premiere reminders as they browse.

## Tests

```bash
npm test
```
