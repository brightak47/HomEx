import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const videos = {
  neon: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  midnight: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  iron: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  bunny: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  elephants: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
};

function youtubeTrailer(id: string) {
  return {
    trailerUrl: `https://www.youtube.com/watch?v=${id}`,
    posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

async function main() {
  await db.reaction.deleteMany();
  await db.chatMessage.deleteMany();
  await db.notification.deleteMany();
  await db.savedPremiere.deleteMany();
  await db.playbackSession.deleteMany();
  await db.deviceSession.deleteMany();
  await db.transaction.deleteMany();
  await db.ticket.deleteMany();
  await db.payment.deleteMany();
  await db.order.deleteMany();
  await db.guestInvitation.deleteMany();
  await db.castMember.deleteMany();
  await db.premiereSession.deleteMany();
  await db.premiere.deleteMany();
  await db.movie.deleteMany();
  await db.celebrityProfile.deleteMany();
  await db.producerProfile.deleteMany();
  await db.auditLog.deleteMany();
  await db.user.deleteMany();
  await db.platformSettings.deleteMany();

  const passwordHash = await bcrypt.hash("homex123", 10);
  const now = new Date();

  const [viewer, producer, celebrity, admin] = await Promise.all([
    db.user.create({
      data: {
        email: "viewer@homex.app",
        passwordHash,
        name: "Ama Boateng",
        role: "VIEWER",
        country: "GH",
      },
    }),
    db.user.create({
      data: {
        email: "producer@homex.app",
        passwordHash,
        name: "Kwame Mensah",
        role: "PRODUCER",
        country: "GH",
        producerProfile: {
          create: {
            studioName: "Gold Coast Pictures",
            bio: "Independent studio premiering African cinema worldwide.",
            country: "GH",
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: "celebrity@homex.app",
        passwordHash,
        name: "Idris Elba",
        role: "CELEBRITY",
        celebrityProfile: {
          create: {
            displayName: "Idris Elba",
            bio: "Actor and producer.",
            knownFor: "Live premiere appearances",
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: "admin@homex.app",
        passwordHash,
        name: "HomEx Admin",
        role: "ADMIN",
      },
    }),
  ]);

  await db.platformSettings.create({
    data: {
      id: "global",
      commissionType: "PERCENTAGE",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 0,
      maxConcurrentStreams: 1,
      terminatePriorSession: true,
    },
  });

  const neon = await db.premiere.create({
    data: {
      producer: { connect: { id: producer.id } },
      scheduledAt: new Date(now.getTime() - 8 * 60_000),
      timezone: "America/New_York",
      durationMinutes: 90,
      ticketPriceCents: 799,
      status: "LIVE",
      phase: "MOVIE",
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60_000),
      playbackStartedAt: new Date(now.getTime() - 8 * 60_000),
      movie: {
        create: {
          title: "Neon Harbor",
          description:
            "A rain-soaked detective crosses a blackout city to stop a stolen premiere print from vanishing forever.",
          genre: "Neo-Noir",
          runtimeMinutes: 118,
          posterUrl:
            "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80",
          trailerUrl: videos.neon,
          movieAssetUrl: videos.neon,
          director: "Lena Okoye",
          country: "US",
          castMembers: {
            create: [
              { name: "Idris Elba", role: "Lead" },
              { name: "Lupita Nyong'o", role: "Detective Kade" },
              { name: "John Boyega", role: "The Archivist" },
            ],
          },
        },
      },
      invitations: {
        create: [
          {
            name: "Idris Elba",
            email: celebrity.email,
            guestRole: "CELEBRITY",
            status: "ACCEPTED",
            token: "invite-neon-idris",
            celebrityProfileId: (await db.celebrityProfile.findUnique({
              where: { userId: celebrity.id },
            }))!.id,
          },
          {
            name: "Lena Okoye",
            email: "lena@goldcoast.film",
            guestRole: "DIRECTOR",
            status: "ACCEPTED",
            token: "invite-neon-lena",
          },
        ],
      },
    },
  });

  const midnight = await db.premiere.create({
    data: {
      producer: { connect: { id: producer.id } },
      scheduledAt: new Date(now.getTime() + 18 * 60_000),
      timezone: "Europe/London",
      durationMinutes: 102,
      ticketPriceCents: 999,
      status: "STARTING_SOON",
      phase: "PRE_SHOW",
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60_000),
      movie: {
        create: {
          title: "Midnight Protocol",
          description:
            "When a classified satellite blinks awake, three estranged siblings must finish their father's last film before dawn.",
          genre: "Sci-Fi",
          runtimeMinutes: 124,
          posterUrl:
            "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1400&q=80",
          trailerUrl: videos.midnight,
          movieAssetUrl: videos.midnight,
          director: "Amara Diallo",
          country: "GB",
          castMembers: {
            create: [
              { name: "Daniel Kaluuya", role: "Elias" },
              { name: "Letitia Wright", role: "Noor" },
              { name: "Chiwetel Ejiofor", role: "The Handler" },
            ],
          },
        },
      },
      invitations: {
        create: [
          {
            name: "Amara Diallo",
            email: "amara@goldcoast.film",
            guestRole: "DIRECTOR",
            status: "ACCEPTED",
            token: "invite-midnight-amara",
          },
        ],
      },
    },
  });

  const ghanaFilms = [
    {
      title: "King of Tɛma",
      description:
        "A crime drama from Tema about loyalty, betrayal, and redemption in Ghana’s industrial port city.",
      genre: "Crime",
      runtimeMinutes: 110,
      director: "Kobina de Graft-Johnson",
      youtubeId: "BBcEq-4q-b0",
      movieAssetUrl: videos.bunny,
      ticketPriceCents: 4999,
      daysFromNow: 3,
      cast: [
        { name: "Fred Amugi", role: "Cast" },
        { name: "Kweku Elliott", role: "Cast" },
        { name: "Kingsley Yamoah", role: "Cast" },
      ],
    },
    {
      title: "The Burial of Kojo",
      description:
        "A gifted girl travels lands between life and death to find her father after he vanishes in an abandoned gold mine.",
      genre: "Drama",
      runtimeMinutes: 80,
      director: "Blitz Bazawule",
      youtubeId: "2l7gC3fa3m0",
      movieAssetUrl: videos.elephants,
      ticketPriceCents: 3999,
      daysFromNow: 7,
      cast: [
        { name: "Cynthia Dankwa", role: "Esi" },
        { name: "Ama K. Abebrese", role: "Cast" },
        { name: "Joseph Otsiman", role: "Kojo" },
      ],
    },
    {
      title: "Azali",
      description:
        "Amina is sent from northern Ghana to escape an arranged marriage, then must survive Accra’s slums to find her way home.",
      genre: "Drama",
      runtimeMinutes: 92,
      director: "Kwabena Gyansah",
      youtubeId: "2GAzfj-WYFs",
      movieAssetUrl: videos.midnight,
      ticketPriceCents: 4499,
      daysFromNow: 12,
      cast: [
        { name: "Ama K. Abebrese", role: "Joan" },
        { name: "Adjetey Anang", role: "Akatok" },
        { name: "Emmanuel Nii Adom Quaye", role: "Quartey" },
      ],
    },
    {
      title: "Aloe Vera",
      description:
        "Two neighboring Ghanaian communities feud for generations until a love story forces them to choose peace.",
      genre: "Romance",
      runtimeMinutes: 120,
      director: "Peter Sedufia",
      youtubeId: "sLpfkKnF1Rs",
      movieAssetUrl: videos.neon,
      ticketPriceCents: 5499,
      daysFromNow: 16,
      cast: [
        { name: "Priscilla Opoku-Agyeman", role: "Cast" },
        { name: "Adjetey Anang", role: "Cast" },
        { name: "Naa Ashorkor", role: "Cast" },
        { name: "Nana Ama McBrown", role: "Cast" },
      ],
    },
    {
      title: "Borga",
      description:
        "Kojo leaves Agbogbloshie for Germany chasing the myth of the wealthy borga, then must face the life he left behind.",
      genre: "Drama",
      runtimeMinutes: 104,
      director: "York-Fabian Raabe",
      youtubeId: "-4ji4fZXuTg",
      movieAssetUrl: videos.iron,
      ticketPriceCents: 5999,
      daysFromNow: 21,
      cast: [
        { name: "Eugene Boateng", role: "Kojo" },
        { name: "Christiane Paul", role: "Lina" },
        { name: "Adjetey Anang", role: "Cast" },
      ],
    },
  ] as const;

  for (const film of ghanaFilms) {
    const trailer = youtubeTrailer(film.youtubeId);
    await db.premiere.create({
      data: {
        producer: { connect: { id: producer.id } },
        scheduledAt: new Date(now.getTime() + film.daysFromNow * 24 * 60 * 60_000),
        timezone: "Africa/Accra",
        durationMinutes: film.runtimeMinutes,
        ticketPriceCents: film.ticketPriceCents,
        currency: "GHS",
        status: "TICKETS_ON_SALE",
        publishedAt: new Date(now.getTime() - 24 * 60 * 60_000),
        movie: {
          create: {
            title: film.title,
            description: film.description,
            genre: film.genre,
            runtimeMinutes: film.runtimeMinutes,
            posterUrl: trailer.posterUrl,
            trailerUrl: trailer.trailerUrl,
            movieAssetUrl: film.movieAssetUrl,
            director: film.director,
            country: "GH",
            castMembers: {
              create: [...film.cast],
            },
          },
        },
      },
    });
  }

  await db.premiere.create({
    data: {
      producer: { connect: { id: producer.id } },
      scheduledAt: new Date(now.getTime() + 12 * 24 * 60 * 60_000),
      timezone: "America/New_York",
      durationMinutes: 105,
      ticketPriceCents: 1499,
      status: "DRAFT",
      movie: {
        create: {
          title: "Iron Orchard",
          description: "A heist across a dying industrial coast, told in one unbroken dusk.",
          genre: "Action",
          runtimeMinutes: 117,
          posterUrl:
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1400&q=80",
          trailerUrl: videos.iron,
          movieAssetUrl: videos.iron,
          director: "Ravi Shah",
          country: "US",
        },
      },
    },
  });

  const order = await db.order.create({
    data: {
      userId: viewer.id,
      premiereId: neon.id,
      status: "PAID",
      totalCents: 799,
      currency: "USD",
      provider: "demo",
      providerRef: "seed_neon",
      payments: {
        create: {
          provider: "demo",
          providerRef: "seed_neon",
          amountCents: 799,
          status: "SUCCEEDED",
        },
      },
    },
  });

  const ticket = await db.ticket.create({
    data: {
      userId: viewer.id,
      premiereId: neon.id,
      orderId: order.id,
      paymentId: (await db.payment.findFirst({ where: { orderId: order.id } }))!.id,
      priceCents: 799,
      commissionCents: 80,
      producerEarningsCents: 719,
      status: "PAID",
    },
  });

  await db.transaction.createMany({
    data: [
      {
        type: "TICKET_SALE",
        amountCents: 799,
        premiereId: neon.id,
        ticketId: ticket.id,
        producerId: producer.id,
        note: "Seed sale",
      },
      {
        type: "PLATFORM_COMMISSION",
        amountCents: 80,
        premiereId: neon.id,
        ticketId: ticket.id,
        producerId: producer.id,
      },
      {
        type: "PRODUCER_EARNINGS",
        amountCents: 719,
        premiereId: neon.id,
        ticketId: ticket.id,
        producerId: producer.id,
      },
    ],
  });

  await db.savedPremiere.create({
    data: { userId: viewer.id, premiereId: midnight.id },
  });

  await db.notification.createMany({
    data: [
      {
        userId: viewer.id,
        type: "TICKET_PURCHASED",
        title: "Ticket confirmed",
        body: "You're in for Neon Harbor. The room is already open.",
        premiereId: neon.id,
      },
      {
        userId: viewer.id,
        type: "PREMIERE_STARTING",
        title: "Premiere starting",
        body: "Neon Harbor is live. Take your seat.",
        premiereId: neon.id,
      },
      {
        userId: producer.id,
        type: "GUEST_ANNOUNCEMENT",
        title: "Watch with Idris Elba",
        body: "Idris Elba accepted the Neon Harbor invitation.",
        premiereId: neon.id,
      },
    ],
  });

  await db.chatMessage.createMany({
    data: [
      {
        premiereId: neon.id,
        userId: celebrity.id,
        body: "Thanks for coming. We shot the harbor scene in one night.",
      },
      {
        premiereId: neon.id,
        userId: producer.id,
        body: "Welcome to the worldwide premiere. Lights down.",
      },
    ],
  });

  console.log("HomEx seed ready.");
  console.log("viewer@homex.app / homex123");
  console.log("producer@homex.app / homex123");
  console.log("celebrity@homex.app / homex123");
  console.log("admin@homex.app / homex123");
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
