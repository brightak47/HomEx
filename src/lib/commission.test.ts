import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateEarnings, splitRevenue } from "./commission";

describe("splitRevenue", () => {
  it("takes 10% on a $10 ticket", () => {
    const split = splitRevenue(1000, {
      commissionType: "PERCENTAGE",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 0,
    });
    assert.equal(split.commissionCents, 100);
    assert.equal(split.producerEarningsCents, 900);
  });

  it("takes a $1 fixed fee on a $10 ticket", () => {
    const split = splitRevenue(1000, {
      commissionType: "FIXED",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 0,
    });
    assert.equal(split.commissionCents, 100);
    assert.equal(split.producerEarningsCents, 900);
  });

  it("honors a minimum platform fee", () => {
    const split = splitRevenue(100, {
      commissionType: "PERCENTAGE",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 50,
    });
    assert.equal(split.commissionCents, 50);
    assert.equal(split.producerEarningsCents, 50);
  });

  it("never commissions more than the ticket price", () => {
    const split = splitRevenue(80, {
      commissionType: "FIXED",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 0,
    });
    assert.equal(split.commissionCents, 80);
    assert.equal(split.producerEarningsCents, 0);
  });

  it("projects 1,000 tickets at $10 and 10%", () => {
    const estimate = estimateEarnings(1000, 1000, {
      commissionType: "PERCENTAGE",
      percentageBps: 1000,
      fixedFeeCents: 100,
      minFeeCents: 0,
    });
    assert.equal(estimate.grossRevenueCents, 1_000_000);
    assert.equal(estimate.commissionCents, 100_000);
    assert.equal(estimate.producerEarningsCents, 900_000);
  });
});
