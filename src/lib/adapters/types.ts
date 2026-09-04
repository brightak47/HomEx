export type PaymentCheckoutInput = {
  orderId: string;
  premiereId: string;
  premiereTitle: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type PaymentCheckoutResult = {
  provider: string;
  checkoutUrl?: string;
  demoCompleted?: boolean;
  providerRef?: string;
};

export type VideoPlaybackGrant = {
  provider: "mux" | "local";
  playbackUrl: string;
  token: string;
  expiresAt: string;
};

export type WatchPartyGrant = {
  provider: "livekit" | "local";
  roomName: string;
  token?: string;
  wsUrl?: string;
  canPublish: boolean;
};
