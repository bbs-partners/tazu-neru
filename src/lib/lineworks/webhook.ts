import crypto from "crypto";

export function verifySignature(body: string, signature: string): boolean {
  const botSecret = process.env.LINEWORKS_BOT_SECRET!;
  const expected = crypto
    .createHmac("sha256", botSecret)
    .update(body)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export interface WebhookBody {
  bot_id: string;
  events: WebhookEvent[];
}

export interface WebhookEvent {
  type: string;
  event_id: string;
  timestamp: string;
  user_id: string;
  channel_id?: string;
  reply_token?: string;
  content: {
    type: string;
    text?: string;
    postback?: string;
  };
}
