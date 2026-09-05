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

Open [http://localhost:3100](http://localhost:3100). HomEx uses **3100** so it does not collide with other apps on 3000.

### Cursor browser

HomEx listens on port **3100** and is declared in `.cursor/environment.json` plus `.vscode/settings.json` so Cursor can forward it into Simple Browser.

1. Keep the agent (or a local `npm run dev`) running.
2. Open the **Ports** panel (plug icon in the editor).
3. Confirm **3100 / HomEx** is forwarded.
4. Click **Open in Browser** (or Command Palette → “Simple Browser: Show” → `http://localhost:3100`).

If you see `ERR_CONNECTION_REFUSED`, the preview is hitting your laptop instead of the forwarded agent port. Use the Ports panel link, not a separately typed localhost URL.

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
