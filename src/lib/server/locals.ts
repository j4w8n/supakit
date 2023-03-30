import type { Handle } from "@sveltejs/kit"
import { createClient, type Session } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'

export const locals = (async ({ event, resolve }) => {
  const cookie: Session = event.cookies.get('sb-session') ? JSON.parse(event.cookies.get('sb-session') || '') : null
  console.log('cookie', cookie)

  // get jwt info
  const token = cookie ? JSON.parse(decodeBase64URL(cookie.access_token.split('.')[1])) : null
  
  event.locals.session = token ? {
    user: cookie.user,
    access_token: cookie.access_token,
    refresh_token: cookie.refresh_token,
    expires_in: Math.floor(token.exp - (Date.now()/1000)),
    token_type: 'bearer'
  } : null

  event.locals.supabase = event.locals.session ? createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: { 'Authorization': `Bearer ${event.locals.session.access_token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }) : null

  if (event.locals.supabase && event.locals.session) {
    await event.locals.supabase.auth.setSession({ 
      access_token: event.locals.session.access_token, 
      refresh_token: event.locals.session.refresh_token 
    })
  }

  return await resolve(event)
}) satisfies Handle
