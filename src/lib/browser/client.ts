import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { CookieStorage } from "./storage.js"

export const supabase: SupabaseClient = createClient(
  env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: CookieStorage
    }
  }
)
