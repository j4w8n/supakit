import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export let supabaseServerClient

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const client = async ({ event, resolve }) => {
  const token = event.locals.session.access_token

  if (token) {
    supabaseServerClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
      global: {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    })
  }
  
  return await resolve(event)
}
