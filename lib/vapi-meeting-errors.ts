/**
 * Daily.co (under Vapi) emits these when a room closes normally, on timeout, or after stop().
 * Not actionable — treat as expected call teardown.
 */
const BENIGN_PATTERN =
  /meeting has ended|meeting ended due to ejection|ejected from meeting|left the meeting|already ended|call has ended|room has been deleted|participant left|meeting full|connection closed|call ended/i;

function collectErrorText(reason: unknown, depth = 0): string {
  if (depth > 4) return "";
  if (reason == null) return "";

  if (reason instanceof Error) {
    const err = reason as Error & { cause?: unknown; error?: unknown };
    return [
      err.name,
      err.message,
      err.stack ?? "",
      collectErrorText(err.cause, depth + 1),
      collectErrorText(err.error, depth + 1),
    ].join(" ");
  }

  if (typeof reason === "object") {
    const o = reason as Record<string, unknown>;
    const keys = [
      "message",
      "errorMsg",
      "error",
      "reason",
      "detail",
      "description",
      "msg",
      "type",
    ];
    const parts = keys
      .map((k) => collectErrorText(o[k], depth + 1))
      .filter(Boolean);
    try {
      parts.push(JSON.stringify(reason));
    } catch {
      /* circular */
    }
    return parts.join(" ");
  }

  return String(reason);
}

export function isBenignMeetingShutdown(reason: unknown): boolean {
  const text = collectErrorText(reason);
  return BENIGN_PATTERN.test(text);
}
