import type { Handle } from "@sveltejs/kit"
import { createClient, type Session } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'

export const locals = (async ({ event, resolve }) => {
  const session: Session | null = event.cookies.get('sb-session') ? JSON.parse(event.cookies.get('sb-session') || '') : null

  // get jwt info
  const token = session ? JSON.parse(decodeBase64URL(session.access_token.split('.')[1])) : null
  
  event.locals.session = session ? {
    user: session.user,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: Math.floor(token.exp - (Date.now()/1000)),
    token_type: 'bearer'
  } : null

  event.locals.supabase = session ? createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }) : null

  if (session) {
    await event.locals.supabase!.auth.setSession({ 
      access_token: session.access_token, 
      refresh_token: session.refresh_token 
    })
  }

  return await resolve(event)
}) satisfies Handle
