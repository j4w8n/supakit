import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

export const supabase: SupabaseClient = createClient(
  env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
)
