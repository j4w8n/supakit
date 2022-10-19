import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export let supabaseServerClient

/** @param {string} access_token */
export const initSupabaseServerClient = (access_token) => {
  supabaseServerClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: { 'Authorization': `Bearer ${access_token}` }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}