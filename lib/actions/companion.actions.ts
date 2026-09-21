'use server';

import { auth } from "@clerk/nextjs/server"
import { createSupabaseClient } from "@/lib/supabase"
import {
  localAddSession,
  localCreateCompanion,
  localGetCompanion,
  localGetCompanions,
  localGetSessions,
  localGetUserCompanions,
} from "@/lib/local-companion-store"

/** Companion row joined with session_history for lists (keys vary by DB shape). */
export type SessionCompanionRow = {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
  sessionRowId?: string;
};


export const createCompanion = async (formData:CreateCompanion) => {
    const {userId : author} = await auth();
    const supabase = createSupabaseClient()
    if (!supabase) {
        return localCreateCompanion(formData, author ?? null);
    }

    const {data, error} = await supabase
    .from('companion')
    .insert({...formData, author}).select();

    if(error || !data) throw new Error(error?.message || "Failed to create a companion");

    return data[0];
}


export const getAllCompanions = async({limit=10, page =1,subject,topic}:GetAllCompanions) => {
const supabase = createSupabaseClient();
if (!supabase) {
    return localGetCompanions({ limit, page, subject, topic });
}

let query = supabase.from('companion').select();

if(subject && topic){
    query = query.ilike('subject',`%${subject}%`).or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
} else if(subject){
    query = query.ilike('subject',`%${subject}%`)
} else if(topic){
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
}

query = query.range((page - 1) * limit, page * limit-1)

const {data:companions,error} = await query;

if(error) throw new Error(error.message)
    return companions;
}

export const getComapnaion = async(id:string) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
        return localGetCompanion(id);
    }

    const {data, error} = await supabase.from('companion').select().eq('id',id);

    if(error) return console.log(error)
        return data[0];
}

// Add a new session history entry
export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();
  if (!supabase) {
    return localAddSession(companionId, userId ?? null);
  }

  const { data, error } = await supabase
    .from('session_history')
    .insert({
      companion_id: companionId,
      user_id: userId,
    })
    .select(); // optional: returns the inserted row(s)

  if (error) throw new Error(error.message);

  return data;
};

// Get recent session companions
export const getRecentSessions = async (
  limit = 10
): Promise<SessionCompanionRow[]> => {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return localGetSessions({ limit });
  }

  const { data, error } = await supabase
    .from('session_history')
    .select(`session_pk:id, companions:companion_id(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data
    .map((row) => {
      const sessionPk = row.session_pk as string | undefined;
      const raw = row.companions;
      const companion = Array.isArray(raw) ? raw[0] : raw;
      if (!companion || typeof companion !== 'object') return null;
      const c = companion as Record<string, unknown>;
      return {
        ...c,
        sessionRowId: sessionPk,
      } as SessionCompanionRow;
    })
    .filter((row): row is SessionCompanionRow => row != null);
};

// Get recent user session companions
export const getUserSessions = async (
  userId: string,
  limit = 10
): Promise<SessionCompanionRow[]> => {

  const supabase = createSupabaseClient();
  if (!supabase) {
    return localGetSessions({ userId, limit });
  }

  const { data, error } = await supabase
    .from('session_history')
    .select(`session_pk:id, companions:companion_id(*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data
    .map((row) => {
      const sessionPk = row.session_pk as string | undefined;
      const raw = row.companions;
      const companion = Array.isArray(raw) ? raw[0] : raw;
      if (!companion || typeof companion !== 'object') return null;
      const c = companion as Record<string, unknown>;
      return {
        ...c,
        sessionRowId: sessionPk,
      } as SessionCompanionRow;
    })
    .filter((row): row is SessionCompanionRow => row != null);
};

export const getUserCompanion = async (userId: string) => {

  const supabase = createSupabaseClient();
  if (!supabase) {
    return localGetUserCompanions(userId);
  }

  const { data, error } = await supabase
    .from('companion')
    .select()
    .eq('author', userId)

  if (error) throw new Error(error.message);

  return data;
};

