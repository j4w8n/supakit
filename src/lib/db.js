import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

/** @type {import('@supabase/supabase-js').SupabaseClient} */
/** 
 * TODO: replace `PUBLIC_` with value of svelte.config.js kit.env.publicPrefix
 */
export const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
  auth: {
    persistSession: false
  }
})

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export let supabaseServerClient

/** @param {string} access_token */
export const createSupabaseServerClient = (access_token) => {
  /** 
   * TODO: replace `PUBLIC_` with value of svelte.config.js kit.env.publicPrefix
   */
  supabaseServerClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: { 'Authorization': `Bearer ${access_token}` }
    }
  })
}