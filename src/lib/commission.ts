export type CommissionType = "PERCENTAGE" | "FIXED";

export type CommissionConfig = {
  commissionType: CommissionType;
  percentageBps: number;
  fixedFeeCents: number;
  minFeeCents: number;
};

export type RevenueSplit = {
  priceCents: number;
  commissionCents: number;
  producerEarningsCents: number;
};

export function asCommissionConfig(input: {
  commissionType: string;
  percentageBps: number;
  fixedFeeCents: number;
  minFeeCents: number;
}): CommissionConfig {
  return {
    commissionType: input.commissionType === "FIXED" ? "FIXED" : "PERCENTAGE",
    percentageBps: input.percentageBps,
    fixedFeeCents: input.fixedFeeCents,
    minFeeCents: input.minFeeCents,
  };
}

export function splitRevenue(
  priceCents: number,
  config: CommissionConfig,
): RevenueSplit {
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    throw new Error("Ticket price must be a non-negative amount");
  }

  let commissionCents =
    config.commissionType === "PERCENTAGE"
      ? Math.round((priceCents * config.percentageBps) / 10_000)
      : config.fixedFeeCents;

  commissionCents = Math.max(commissionCents, config.minFeeCents);
  commissionCents = Math.min(commissionCents, priceCents);

  return {
    priceCents,
    commissionCents,
    producerEarningsCents: priceCents - commissionCents,
  };
}

export function estimateEarnings(
  ticketPriceCents: number,
  ticketsSold: number,
  config: CommissionConfig,
) {
  const perTicket = splitRevenue(ticketPriceCents, config);
  return {
    ticketsSold,
    ticketPriceCents,
    grossRevenueCents: ticketPriceCents * ticketsSold,
    commissionCents: perTicket.commissionCents * ticketsSold,
    producerEarningsCents: perTicket.producerEarningsCents * ticketsSold,
    perTicket,
  };
}
