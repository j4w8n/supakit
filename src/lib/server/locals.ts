import type { Handle } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

export const locals = (async ({ event, resolve }) => {
  const cookie_list = ['sb-user','sb-access-token','sb-refresh-token']
  let cookies: { [key: string]: string } = {}

  cookie_list.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })

  //@ts-ignore
  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token']
  }
  //@ts-ignore
  event.locals.supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      //@ts-ignore
      headers: { 'Authorization': `Bearer ${event.locals.session.access_token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  return await resolve(event)
}) satisfies Handle
