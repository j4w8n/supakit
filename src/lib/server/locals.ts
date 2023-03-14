import type { Handle } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'
import { decodeBase64URL } from '../utils.js'

export const locals = (async ({ event, resolve }) => {
  const cookie_list = ['sb-user','sb-access-token','sb-refresh-token']
  let cookies: { [key: string]: string } = {}

  cookie_list.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })

  // grab token info
  const token = cookies['sb-access-token'] ? JSON.parse(decodeBase64URL(cookies['sb-access-token'].split('.')[1])) : null

  //@ts-ignore
  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token'],
    expires_in: token ? Math.floor(token.exp - (Date.now()/1000)) : null,
    token_type: 'bearer'
  }

  //@ts-ignore
  event.locals.supabase = event.locals.session.access_token ? createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      //@ts-ignore
      headers: { 'Authorization': `Bearer ${event.locals.session.access_token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }) : null

  return await resolve(event)
}) satisfies Handle
