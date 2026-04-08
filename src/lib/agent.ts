import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getModel } from "./model";
import { getMyTasks, createTask, completeTask } from "./tools/tasks";
import { getCalendar, checkFreeTime } from "./tools/calendar";
import { summarizeThread } from "./tools/summary";

const systemPrompt = `あなたは LINE WORKS 上で動作する業務アシスタント Bot「TaZu-NeRu」です。
ユーザーの質問に対して、利用可能なツールを活用して回答してください。

利用可能な機能:
- タスク管理: ToDo の確認・作成・完了
- カレンダー: 予定の確認・空き時間の確認
- スレッド要約: トークルームの会話を要約

回答は簡潔に、箇条書きを活用してください。
日本語で回答してください。`;

export async function handleMessage(
  userId: string,
  channelId: string | null,
  text: string,
): Promise<string> {
  const { text: reply } = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt: text,
    tools: {
      getMyTasks: tool({
        description:
          "ユーザーのタスク一覧を取得する。期間を指定してフィルタ可能。",
        inputSchema: z.object({
          period: z
            .enum(["today", "this_week", "all"])
            .describe("取得する期間"),
        }),
        execute: async ({ period }) => getMyTasks(userId, period),
      }),
      createTask: tool({
        description: "新しいタスクを作成する。",
        inputSchema: z.object({
          title: z.string().describe("タスクのタイトル"),
          dueDate: z.string().optional().describe("期限（YYYY-MM-DD形式）"),
        }),
        execute: async ({ title, dueDate }) =>
          createTask(userId, title, dueDate),
      }),
      completeTask: tool({
        description: "タスクを完了にする。",
        inputSchema: z.object({
          taskName: z.string().describe("完了にするタスクの名前（部分一致）"),
        }),
        execute: async ({ taskName }) => completeTask(userId, taskName),
      }),
      getCalendar: tool({
        description: "ユーザーの予定を取得する。",
        inputSchema: z.object({
          date: z
            .string()
            .describe("取得する日付（YYYY-MM-DD形式、省略時は今日）"),
        }),
        execute: async ({ date }) => getCalendar(userId, date),
      }),
      checkFreeTime: tool({
        description: "指定した日時の空き状況を確認する。",
        inputSchema: z.object({
          date: z.string().describe("確認する日付（YYYY-MM-DD形式）"),
          startHour: z.number().describe("開始時間（0-23）"),
          endHour: z.number().describe("終了時間（0-23）"),
        }),
        execute: async ({ date, startHour, endHour }) =>
          checkFreeTime(userId, date, startHour, endHour),
      }),
      summarizeThread: tool({
        description:
          "トークルームの会話を要約する。channelId がない場合はユーザーが貼り付けたテキストを要約する。",
        inputSchema: z.object({
          pastedText: z
            .string()
            .optional()
            .describe("ユーザーが貼り付けた要約対象テキスト"),
        }),
        execute: async ({ pastedText }) =>
          summarizeThread(channelId, pastedText),
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return reply || "すみません、回答を生成できませんでした。";
}
