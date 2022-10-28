import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '')
