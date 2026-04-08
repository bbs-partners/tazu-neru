import { Redis } from "@upstash/redis";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MAX_MESSAGES = 200;
const TTL_SECONDS = 7 * 24 * 60 * 60;

interface StoredMessage {
  userId: string;
  text: string;
  timestamp: string;
}

export async function storeMessage(
  channelId: string,
  userId: string,
  text: string,
): Promise<void> {
  const key = `messages:${channelId}`;
  const message: StoredMessage = {
    userId,
    text,
    timestamp: new Date().toISOString(),
  };

  await redis.lpush(key, JSON.stringify(message));
  await redis.ltrim(key, 0, MAX_MESSAGES - 1);
  await redis.expire(key, TTL_SECONDS);
}

export async function summarizeThread(
  channelId: string | null,
  pastedText?: string,
): Promise<string> {
  let textToSummarize: string;

  if (pastedText && pastedText.trim().length > 0) {
    textToSummarize = pastedText;
  } else if (channelId) {
    const key = `messages:${channelId}`;
    const raw = await redis.lrange(key, 0, MAX_MESSAGES - 1);

    if (!raw || raw.length === 0) {
      return "まだメッセージが蓄積されていません。Bot がトークルームに参加してからのメッセージのみ要約できます。";
    }

    const messages: StoredMessage[] = raw.map((r) =>
      typeof r === "string" ? JSON.parse(r) : r,
    );

    textToSummarize = messages
      .reverse()
      .map((m) => `[${m.timestamp}] ${m.userId}: ${m.text}`)
      .join("\n");
  } else {
    return "要約するテキストを貼り付けてください。例: 「以下を要約して\n（テキスト）」";
  }

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system:
      "あなたは会話要約の専門家です。与えられた会話を簡潔に要約してください。重要なポイント、決定事項、アクションアイテムがあれば明記してください。日本語で回答してください。",
    prompt: `以下の会話を要約してください:\n\n${textToSummarize}`,
  });

  return text;
}
