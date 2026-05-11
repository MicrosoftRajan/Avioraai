"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  InterviewDebriefPayload,
  InterviewModeType,
} from "@/lib/interview-session-storage";

const MAX_RESUME_CHARS = 120_000;

async function assertCanMutateRow(id: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { userId } = await auth();
  const { data: row, error } = await admin
    .from("interview_mode_session")
    .select("clerk_user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) return false;
  const owner = row.clerk_user_id as string | null;
  if (owner && owner !== userId) return false;
  return true;
}

export async function persistInterviewSessionStart(input: {
  name: string;
  company: string;
  resumeText: string;
  resumeFileName: string;
  durationMinutes: number;
}): Promise<{ ok: boolean; id: string | null }> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, id: null };
  }

  const { userId } = await auth();
  const resumeText =
    input.resumeText.length > MAX_RESUME_CHARS
      ? input.resumeText.slice(0, MAX_RESUME_CHARS)
      : input.resumeText;

  const { data, error } = await admin
    .from("interview_mode_session")
    .insert({
      clerk_user_id: userId ?? null,
      name: input.name,
      company: input.company,
      resume_text: resumeText,
      resume_file_name: input.resumeFileName,
      duration_minutes: input.durationMinutes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[interview-mode] persistInterviewSessionStart:", error.message);
    return { ok: false, id: null };
  }

  return { ok: true, id: data.id as string };
}

export async function persistInterviewSessionMode(
  id: string,
  mode: InterviewModeType,
): Promise<{ ok: boolean }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false };

  const allowed = await assertCanMutateRow(id);
  if (!allowed) return { ok: false };

  const { error } = await admin
    .from("interview_mode_session")
    .update({
      mode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[interview-mode] persistInterviewSessionMode:", error.message);
    return { ok: false };
  }
  return { ok: true };
}

export async function persistInterviewSessionDebrief(
  id: string,
  debrief: InterviewDebriefPayload,
): Promise<{ ok: boolean }> {
  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false };

  const allowed = await assertCanMutateRow(id);
  if (!allowed) return { ok: false };

  const { error } = await admin
    .from("interview_mode_session")
    .update({
      debrief: debrief as unknown as Record<string, unknown>,
      ended_at: debrief.endedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[interview-mode] persistInterviewSessionDebrief:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
