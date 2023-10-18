import type { Handle } from "@sveltejs/kit"
import { createClient, type Session } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL, isAuthToken } from '../utils.js'
import { CookieStorage } from "./storage.js"
import { supabaseConfig } from '../config/index.js'

export const locals = (async ({ event, resolve }) => {
  const { cookies, locals } = event
  const { client_options, cookie_options } = supabaseConfig({ cookies }).get
  const temp_session = cookies.get('sb-temp-session') ? JSON.parse(cookies.get('sb-temp-session') || '') : null
  const auth_cookie_exists = cookies.getAll().find((cookie) =>
    client_options.auth?.storageKey === cookie.name || isAuthToken(cookie.name)
  )
  const session: Session | null = auth_cookie_exists ? JSON.parse(cookies.get(auth_cookie_exists.name) || '') : temp_session
  const provider_token: string | null = cookies.get('sb-provider-token') ? JSON.parse(cookies.get('sb-provider-token') || '') : null
  const provider_refresh_token: string | null = cookies.get('sb-provider-refresh-token') ? JSON.parse(cookies.get('sb-provider-refresh-token') || '') : null
  const jwt = session ? JSON.parse(decodeBase64URL(session.access_token.split('.')[1])) : null
  
  locals.cookie_options = cookie_options

  locals.session = session ? {
    provider_token,
    provider_refresh_token,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: Math.floor(jwt.exp - (Date.now()/1000)),
    expires_at: jwt.exp,
    token_type: 'bearer',
    user: session.user
  } : null

  locals.supabase = locals.supabase ?? createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: new CookieStorage({ cookies, cookie_options }),
      flowType: client_options.auth?.flowType ?? 'pkce',
      debug: client_options.auth?.debug ?? false,
      ...(client_options.auth?.storageKey ? { storageKey: client_options.auth.storageKey } : {}),
      ...(client_options.auth?.lock ? { lock: client_options.auth.lock } : {})
    }
  })

  if (session) {
    await locals.supabase.auth.setSession({ 
      access_token: session.access_token, 
      refresh_token: session.refresh_token 
    })
  }

  return await resolve(event)
}) satisfies Handle
