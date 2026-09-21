export const VAPI_MISSING_TOKEN_MESSAGE =
  "Voice isn’t configured. Add your Vapi public key as NEXT_PUBLIC_VAPI_WEB_TOKEN (or NEXT_PUBLIC_VAPI_PUBLIC_KEY) in .env.local, then restart npm run dev. Get the key from https://dashboard.vapi.ai";

export function readVapiPublicToken(): string {
  return (
    process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ||
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ||
    process.env.VAPI_PUBLIC_KEY ||
    process.env.VAPI_WEB_TOKEN ||
    ""
  ).trim();
}

export function vapiErrorMessage(error: unknown): string {
  const blob = (() => {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error ?? "");
    }
  })();
  if (/Missing Authorization Header|statusCode":401|"Unauthorized"/i.test(blob)) {
    return VAPI_MISSING_TOKEN_MESSAGE;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Could not start the voice session.";
}
