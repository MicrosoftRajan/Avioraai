import Vapi from "@vapi-ai/web";
import { isBenignMeetingShutdown } from "@/lib/vapi-meeting-errors";

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);

/** Avoid noisy Daily/Vapi teardown warnings in the browser console as unhandled rejections. */
if (typeof window !== "undefined") {
  const w = window as Window & { __aviora_vapi_rejection_patch?: boolean };
  if (!w.__aviora_vapi_rejection_patch) {
    w.__aviora_vapi_rejection_patch = true;
    window.addEventListener("unhandledrejection", (event) => {
      if (isBenignMeetingShutdown(event.reason)) {
        event.preventDefault();
      }
    });
  }
}

