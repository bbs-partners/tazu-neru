# TaZu-NeRu

LINE WORKS 上で動作する業務アシスタント Bot。自然言語で話しかけるだけで、ToDo・カレンダー・スレッド要約を横断的に扱える。

## できること

- **タスク管理** — 「今日のToDo何？」「報告書を書く、をタスクに追加して」「報告書のタスク完了にして」
- **カレンダー** — 「明日の予定は？」「来週月曜の午後空いてる？」
- **スレッド要約** — Bot が参加しているトークルームで「要約して」/ テキストを貼り付けて「以下を要約して」

## アーキテクチャ

```
LINE WORKS
  ユーザー ──メッセージ──▶ Bot
                           │ Webhook (x-line-signature)
                           ▼
Vercel Functions ── /api/webhook
  │
  ├─ LLM Agent (AI SDK + Claude)
  │    ├─ getMyTasks     → LINE WORKS Task API
  │    ├─ getCalendar    → LINE WORKS Calendar API
  │    └─ summarizeThread → Upstash Redis (蓄積メッセージ)
  │
  └─ Reply API ──▶ LINE WORKS
```

## セットアップ

### 1. LINE WORKS Developer Console

1. [Developer Console](https://dev.worksmobile.com/) でアプリを作成
2. Service Account を発行し、秘密鍵をダウンロード
3. Bot を作成し、Webhook URL に `https://<your-domain>/api/webhook` を設定
4. 必要な OAuth スコープ: `bot`, `task`, `calendar`

### 2. 外部サービス

- **Anthropic API キー** — [console.anthropic.com](https://console.anthropic.com/) で取得
- **Upstash Redis** — [upstash.com](https://upstash.com/) でデータベースを作成（スレッド要約のメッセージ蓄積用）

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、値を埋める。

```bash
cp .env.example .env.local
```

| 変数名                      | 取得元                                        |
| --------------------------- | --------------------------------------------- |
| `LINEWORKS_CLIENT_ID`       | Developer Console > アプリ                    |
| `LINEWORKS_CLIENT_SECRET`   | Developer Console > アプリ                    |
| `LINEWORKS_SERVICE_ACCOUNT` | Developer Console > Service Account           |
| `LINEWORKS_PRIVATE_KEY`     | ダウンロードした秘密鍵（`\n` でエスケープ）   |
| `LINEWORKS_BOT_ID`          | Developer Console > Bot                       |
| `LINEWORKS_BOT_SECRET`      | Developer Console > Bot（Webhook 署名検証用） |
| `ANTHROPIC_API_KEY`         | Anthropic Console                             |
| `UPSTASH_REDIS_REST_URL`    | Upstash Console                               |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash Console                               |

### 4. ローカル開発

```bash
npm install
npm run dev
```

Webhook のローカルテストには [ngrok](https://ngrok.com/) 等でトンネルが必要。

```bash
ngrok http 3000
# 表示された URL を LINE WORKS の Webhook URL に設定
```

### 5. デプロイ

```bash
vercel
```

Vercel にデプロイ後、本番 URL を LINE WORKS の Webhook URL に設定する。

## 技術スタック

- **Next.js** (App Router) + TypeScript
- **Vercel AI SDK** — LLM Tool Calling
- **Anthropic Claude** — 意図判定・応答生成
- **Upstash Redis** — メッセージ蓄積（TTL 7日 / ルームあたり200件上限）
- **LINE WORKS API 2.0** — Bot / Task / Calendar

## ディレクトリ構成

```
src/
├── app/api/webhook/route.ts   # Webhook エンドポイント
├── lib/
│   ├── agent.ts               # LLM Agent（ツール定義・実行）
│   ├── lineworks/
│   │   ├── auth.ts            # JWT 生成・トークン管理
│   │   ├── bot.ts             # メッセージ送信
│   │   ├── client.ts          # API クライアント基盤
│   │   └── webhook.ts         # 署名検証・型定義
│   └── tools/
│       ├── tasks.ts           # タスク取得・作成・完了
│       ├── calendar.ts        # 予定取得・空き時間確認
│       └── summary.ts         # メッセージ蓄積・要約
```
