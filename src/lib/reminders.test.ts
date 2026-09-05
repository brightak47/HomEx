import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { reminderDue } from "./reminders";

describe("reminder windows", () => {
  it("fires the 24-hour reminder inside the day-before window", () => {
    assert.equal(reminderDue("PREMIERE_REMINDER_24H", 20 * 60 * 60_000, "TICKETS_ON_SALE"), true);
    assert.equal(reminderDue("PREMIERE_REMINDER_24H", 30 * 60 * 60_000, "TICKETS_ON_SALE"), false);
  });

  it("fires the 15-minute reminder only close to showtime", () => {
    assert.equal(reminderDue("PREMIERE_REMINDER_15M", 10 * 60_000, "STARTING_SOON"), true);
    assert.equal(reminderDue("PREMIERE_REMINDER_15M", 40 * 60_000, "TICKETS_ON_SALE"), false);
  });

  it("announces the start when the premiere is live", () => {
    assert.equal(reminderDue("PREMIERE_STARTING", -5_000, "LIVE"), true);
    assert.equal(reminderDue("POST_PREMIERE", -90 * 60_000, "ENDED"), true);
  });
});
