import type { Handle } from "@sveltejs/kit"
import { createClient, type Session } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'
import { getCookieOptions } from '../config/index.js'

export const locals = (async ({ event, resolve }) => {
  const { cookies, locals } = event
  const regex = /^sb-.*-auth-token$/
  const temp_session = cookies.get('sb-temp-session') ? JSON.parse(cookies.get('sb-temp-session') || '') : null
  const auth_cookie_exists = cookies.getAll().find(cookie => regex.test(cookie.name))
  const session: Session | null = auth_cookie_exists ? JSON.parse(cookies.get(auth_cookie_exists.name) || '') : temp_session
  const provider_token: string = cookies.get('sb-provider-token') ? JSON.parse(cookies.get('sb-provider-token') || '') : null
  const provider_refresh_token: string = cookies.get('sb-provider-refresh-token') ? JSON.parse(cookies.get('sb-provider-refresh-token') || '') : null

  // get jwt info
  const token = session ? JSON.parse(decodeBase64URL(session.access_token.split('.')[1])) : null
  
  locals.session = session ? {
    provider_token,
    provider_refresh_token,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: Math.floor(token.exp - (Date.now()/1000)),
    expires_at: token.exp,
    token_type: 'bearer',
    user: session.user
  } : null

  locals.supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: {
        'X-Client-Info': 'supakit@v1.0.0-next.112'
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  if (session) {
    await locals.supabase.auth.setSession({ 
      access_token: session.access_token, 
      refresh_token: session.refresh_token 
    })
  }

  locals.cookie_options = getCookieOptions()

  return await resolve(event)
}) satisfies Handle
