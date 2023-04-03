import type { Handle } from "@sveltejs/kit"
import { createClient, type Session } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'
import { getCookieOptions } from '../config/index.js'

export const locals = (async ({ event, resolve }) => {
  const session: Session | null = event.cookies.get('sb-session') ? JSON.parse(event.cookies.get('sb-session') || '') : null
  const provider_token: string = event.cookies.get('sb-provider-token') ? JSON.parse(event.cookies.get('sb-provider-token') || '') : null
  const provider_refresh_token: string = event.cookies.get('sb-provider-refresh-token') ? JSON.parse(event.cookies.get('sb-provider-refresh-token') || '') : null

  // get jwt info
  const token = session ? JSON.parse(decodeBase64URL(session.access_token.split('.')[1])) : null
  
  event.locals.session = session ? {
    provider_token,
    provider_refresh_token,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: Math.floor(token.exp - (Date.now()/1000)),
    expires_at: token.exp,
    token_type: 'bearer',
    user: session.user
  } : null

  event.locals.supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  if (session) {
    await event.locals.supabase.auth.setSession({ 
      access_token: session.access_token, 
      refresh_token: session.refresh_token 
    })
  }

  event.locals.cookie_options = getCookieOptions()

  return await resolve(event)
}) satisfies Handle
