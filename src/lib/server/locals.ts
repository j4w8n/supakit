import type { Handle } from "@sveltejs/kit"
import { createClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

const decodeBase64URL = (value: string): string => {
  const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let base64 = ''
  let chr1, chr2, chr3
  let enc1, enc2, enc3, enc4
  let i = 0
  value = value.replace('-', '+').replace('_', '/')

  while (i < value.length) {
    enc1 = key.indexOf(value.charAt(i++))
    enc2 = key.indexOf(value.charAt(i++))
    enc3 = key.indexOf(value.charAt(i++))
    enc4 = key.indexOf(value.charAt(i++))
    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4
    base64 = base64 + String.fromCharCode(chr1)

    if (enc3 != 64 && chr2 != 0) {
      base64 = base64 + String.fromCharCode(chr2)
    }
    if (enc4 != 64 && chr3 != 0) {
      base64 = base64 + String.fromCharCode(chr3)
    }
  }
  return base64
}

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
