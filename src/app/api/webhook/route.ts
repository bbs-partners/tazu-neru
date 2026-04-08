import { verifySignature, type WebhookBody } from "@/lib/lineworks/webhook";
import { sendMessage } from "@/lib/lineworks/bot";
import { handleMessage } from "@/lib/agent";
import { storeMessage } from "@/lib/tools/summary";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!signature || !verifySignature(body, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const webhook: WebhookBody = JSON.parse(body);

  for (const event of webhook.events) {
    if (event.type !== "message" || event.content.type !== "text") {
      continue;
    }

    const userId = event.user_id;
    const channelId = event.channel_id ?? null;
    const text = event.content.text ?? "";

    if (channelId) {
      storeMessage(channelId, userId, text).catch(console.error);
    }

    try {
      const reply = await handleMessage(userId, channelId, text);
      await sendMessage(userId, channelId, reply);
    } catch (error) {
      console.error("Error handling message:", error);
      await sendMessage(
        userId,
        channelId,
        "エラーが発生しました。もう一度お試しください。",
      );
    }
  }

  return new Response("OK", { status: 200 });
}
