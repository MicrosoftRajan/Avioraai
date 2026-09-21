import {createClient, type SupabaseClient} from "@supabase/supabase-js"
import {auth} from "@clerk/nextjs/server"

export const createSupabaseClient = (): SupabaseClient | null => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    return createClient(url, key, {
        async accessToken(){
            return ((await auth()).getToken());
        }
    })
}
