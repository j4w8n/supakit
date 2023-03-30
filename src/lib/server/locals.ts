import type { Handle } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'

export const locals = (async ({ event, resolve }) => {
  const cookie_list = ['sb-user','sb-access-token','sb-refresh-token']
  let cookies: { [key: string]: any } = {}

  cookie_list.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })

  // grab token info
  const token = cookies['sb-access-token'] ? JSON.parse(decodeBase64URL(cookies['sb-access-token'].split('.')[1])) : null

  event.locals.session = token ? {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token'],
    expires_in: token ? Math.floor(token.exp - (Date.now()/1000)) : 0,
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
