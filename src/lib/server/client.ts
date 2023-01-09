import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Handle } from "@sveltejs/kit"
import { env } from '$env/dynamic/public'

export let supabaseServerClient: SupabaseClient

export const client = (async ({ event, resolve }) => {
  const token = event.locals.session.access_token

  if (token) {
    supabaseServerClient = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
      global: {
        headers: { 'Authorization': `Bearer ${token}` }
      },
      auth: {
        persistSession: false
      }
    })
  }
  
  return await resolve(event)
}) satisfies Handle
