import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  officialPlaybackPositionMs,
  resolvePremierePhase,
  resolvePremiereStatus,
} from "./lifecycle";

const base = {
  status: "TICKETS_ON_SALE",
  scheduledAt: new Date("2026-09-04T20:00:00.000Z"),
  durationMinutes: 90,
  preShowMinutes: 20,
  publishedAt: new Date("2026-09-01T00:00:00.000Z"),
};

describe("premiere lifecycle", () => {
  it("stays on sale before the pre-show window", () => {
    assert.equal(
      resolvePremiereStatus({
        ...base,
        now: new Date("2026-09-04T19:30:00.000Z"),
      }),
      "TICKETS_ON_SALE",
    );
  });

  it("moves to starting soon 20 minutes before showtime", () => {
    assert.equal(
      resolvePremiereStatus({
        ...base,
        now: new Date("2026-09-04T19:45:00.000Z"),
      }),
      "STARTING_SOON",
    );
  });

  it("goes live at the scheduled start", () => {
    assert.equal(
      resolvePremiereStatus({
        ...base,
        now: new Date("2026-09-04T20:00:00.000Z"),
      }),
      "LIVE",
    );
  });

  it("ends after the premiere duration", () => {
    assert.equal(
      resolvePremiereStatus({
        ...base,
        now: new Date("2026-09-04T21:31:00.000Z"),
      }),
      "ENDED",
    );
  });

  it("keeps drafts unpublished", () => {
    assert.equal(
      resolvePremiereStatus({
        ...base,
        status: "DRAFT",
        publishedAt: null,
        now: new Date("2026-09-04T20:00:00.000Z"),
      }),
      "DRAFT",
    );
  });

  it("maps pre-show, movie, and after-show phases", () => {
    assert.equal(
      resolvePremierePhase({ ...base, now: new Date("2026-09-04T19:50:00.000Z") }),
      "PRE_SHOW",
    );
    assert.equal(
      resolvePremierePhase({ ...base, now: new Date("2026-09-04T20:10:00.000Z") }),
      "MOVIE",
    );
    assert.equal(
      resolvePremierePhase({ ...base, now: new Date("2026-09-04T21:40:00.000Z") }),
      "AFTER_SHOW",
    );
  });

  it("syncs late joiners to the official playback position", () => {
    const position = officialPlaybackPositionMs({
      scheduledAt: new Date("2026-09-04T20:00:00.000Z"),
      durationMinutes: 90,
      now: new Date("2026-09-04T20:12:00.000Z"),
    });
    assert.equal(position, 12 * 60_000);
  });
});
