import { createClient } from "@supabase/supabase-js"
// @ts-ignore
import { env } from '$env/dynamic/public'

export const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '')
