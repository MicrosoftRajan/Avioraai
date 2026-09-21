import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function openaiChatCompletion(input: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "missing_key" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: input.messages,
        temperature: input.temperature ?? 0.3,
        max_tokens: input.maxTokens ?? 1800,
        ...(input.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `openai_${res.status}` };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) return { ok: false, error: "empty" };
    return { ok: true, content };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "openai_failed",
    };
  }
}

export function jsonWithServerTiming<T>(
  body: T,
  _timing?: { total: number },
  init?: ResponseInit,
) {
  return NextResponse.json(body, init);
}
