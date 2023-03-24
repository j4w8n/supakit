import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

export const supabaseClient: SupabaseClient = createClient(
  env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
)
