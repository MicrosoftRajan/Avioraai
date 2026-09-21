import { readVapiPublicToken, VAPI_MISSING_TOKEN_MESSAGE } from "@/lib/vapi-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const token = readVapiPublicToken();
  if (!token) {
    return NextResponse.json(
      { error: VAPI_MISSING_TOKEN_MESSAGE },
      { status: 503 },
    );
  }
  return NextResponse.json({ token });
}
