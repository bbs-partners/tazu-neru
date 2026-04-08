import type { LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

type Provider = "anthropic" | "openai" | "google";

const PROVIDER_CONFIG: Record<
  Provider,
  { create: (id: string) => LanguageModel; defaultModel: string }
> = {
  anthropic: {
    create: (id) => anthropic(id),
    defaultModel: "claude-sonnet-4-6",
  },
  openai: {
    create: (id) => openai(id),
    defaultModel: "gpt-4o",
  },
  google: {
    create: (id) => google(id),
    defaultModel: "gemini-2.0-flash",
  },
};

export function getModel(): LanguageModel {
  const provider = (process.env.LLM_PROVIDER ?? "anthropic") as Provider;
  const modelId = process.env.LLM_MODEL;

  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw new Error(
      `Unknown LLM_PROVIDER: ${provider}. Use: anthropic, openai, google`,
    );
  }

  return config.create(modelId ?? config.defaultModel);
}
