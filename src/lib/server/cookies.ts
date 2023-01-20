import { getConfig } from 'config'
import type { Session } from '@supabase/supabase-js'
import type { Handle } from "@sveltejs/kit"

export const cookies = (async ({ event, resolve }) => {
  const config = await getConfig()
  const cookie_route = config.supakit.cookie.route
  const cookie_options = config.supakit.cookie.options
  const session: Session | null = event.request.body ? await event.request.json() : null
  const cookies_to_set = Object.entries({
    'sb-user': session?.user,
    'sb-access-token': session?.access_token,
    'sb-refresh-token': session?.refresh_token
  })

  if (event.url.pathname === cookie_route) {
    /* Handle request to the configured cookie route /supakit */

    if (event.request.method === 'POST') {
      if (session) {
        const response = new Response(null)
        cookies_to_set.forEach(([name, value]) => {
          response.headers.append('set-cookie', event.cookies.serialize(name, JSON.stringify(value), cookie_options))
        })
        return response
      } else {
        return new Response('Expecting JSON body, but body was null.', { status: 400 })
      }
    } else if (event.request.method === 'DELETE') {
      const response = new Response(null, { status: 204 })
      const expire_options = {
        ...cookie_options,
        maxAge: -1
      }
      cookies_to_set.forEach(([name]) => {
        response.headers.append('set-cookie', event.cookies.serialize(name, '', expire_options))
      })
      return response
    }
  }

  return await resolve(event)
}) satisfies Handle
