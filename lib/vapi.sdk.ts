"use client";

import Vapi from "@vapi-ai/web";
import {
  readVapiPublicToken,
  VAPI_MISSING_TOKEN_MESSAGE,
  vapiErrorMessage,
} from "@/lib/vapi-auth";
import { isBenignMeetingShutdown } from "@/lib/vapi-meeting-errors";

export const vapi = new Vapi(readVapiPublicToken() || "missing-vapi-token");

async function resolveVapiToken(): Promise<string> {
  const fromEnv = readVapiPublicToken();
  if (fromEnv) return fromEnv;

  const res = await fetch("/api/vapi/client-token", { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as {
    token?: string;
    error?: string;
  };
  const token = json.token?.trim() ?? "";
  if (!res.ok || !token) {
    throw new Error(json.error || VAPI_MISSING_TOKEN_MESSAGE);
  }
  return token;
}

function applyVapiToken(token: string): void {
  // Vapi's HTTP client is a module singleton; constructing with the real
  // token sets Authorization for the shared client used by `vapi`.
  new Vapi(token);
}

function swallowBenignPromise(promise: unknown): void {
  if (
    promise &&
    typeof promise === "object" &&
    "catch" in promise &&
    typeof (promise as Promise<unknown>).catch === "function"
  ) {
    (promise as Promise<unknown>).catch((reason) => {
      if (!isBenignMeetingShutdown(reason)) {
        console.warn("[vapi]", reason);
      }
    });
  }
}

/** Stop voice call; ignores Daily.co "Meeting ended due to ejection" teardown errors. */
export function safeVapiStop(): void {
  try {
    swallowBenignPromise(vapi.stop());
  } catch (reason) {
    if (!isBenignMeetingShutdown(reason)) {
      console.warn("[vapi] stop", reason);
    }
  }
}

/** Start voice call after attaching a real Vapi token so Authorization is sent. */
export async function safeVapiStart(
  ...args: Parameters<Vapi["start"]>
): ReturnType<Vapi["start"]> {
  const token = await resolveVapiToken();
  applyVapiToken(token);
  try {
    const result = vapi.start(...args);
    swallowBenignPromise(result);
    return result;
  } catch (reason) {
    if (!isBenignMeetingShutdown(reason)) {
      console.warn("[vapi] start", reason);
    }
    throw reason instanceof Error ? reason : new Error(vapiErrorMessage(reason));
  }
}

function installBrowserTeardownGuards(): void {
  const w = window as Window & { __aviora_vapi_teardown_patch?: boolean };
  if (w.__aviora_vapi_teardown_patch) return;
  w.__aviora_vapi_teardown_patch = true;

  window.addEventListener("unhandledrejection", (event) => {
    if (isBenignMeetingShutdown(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    if (isBenignMeetingShutdown(event.error ?? event.message)) {
      event.preventDefault();
    }
  });
}

if (typeof window !== "undefined") {
  installBrowserTeardownGuards();
}
