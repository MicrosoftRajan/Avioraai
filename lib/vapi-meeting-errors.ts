/**
 * Daily.co (used under Vapi) often rejects with these messages when a room
 * closes normally or after vapi.stop(). Not actionable user-facing errors.
 */
export function isBenignMeetingShutdown(reason: unknown): boolean {
  let text = "";
  if (reason instanceof Error) {
    text = `${reason.message} ${reason.stack ?? ""}`;
  } else if (
    reason !== null &&
    typeof reason === "object" &&
    "message" in reason
  ) {
    text = String((reason as { message?: unknown }).message ?? "");
  } else {
    text = String(reason ?? "");
  }

  return /Meeting has ended|Meeting ended due to ejection|ejected from meeting|left the meeting|already ended/i.test(
    text,
  );
}
