import Vapi from "@vapi-ai/web";
import { isBenignMeetingShutdown } from "@/lib/vapi-meeting-errors";

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

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

/** Start voice call; surfaces only non-teardown failures. */
export function safeVapiStart(
  ...args: Parameters<Vapi["start"]>
): ReturnType<Vapi["start"]> {
  try {
    const result = vapi.start(...args);
    swallowBenignPromise(result);
    return result;
  } catch (reason) {
    if (!isBenignMeetingShutdown(reason)) {
      console.warn("[vapi] start", reason);
    }
    throw reason;
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
