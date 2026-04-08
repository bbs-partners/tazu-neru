import { lineworksFetch } from "./client";

const BOT_ID = process.env.LINEWORKS_BOT_ID!;

export async function sendMessage(
  userId: string,
  channelId: string | null,
  content: string,
): Promise<void> {
  if (channelId) {
    await lineworksFetch(`/bots/${BOT_ID}/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        content: { type: "text", text: content },
      }),
    });
  } else {
    await lineworksFetch(`/bots/${BOT_ID}/users/${userId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        content: { type: "text", text: content },
      }),
    });
  }
}
