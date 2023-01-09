import { getConfig } from '$supakit/config'
import type { Session } from '@supabase/supabase-js'
import type { Handle } from "@sveltejs/kit"

const config = getConfig()

export const cookies = (async ({ event, resolve }) => {
  const cookieRoute = config.supakit.cookie.route
  const cookieOptions = config.supakit.cookie.options
  const session: Session | null = event.request.body ? await event.request.json() : null
  const cookiesToSet = Object.entries({
    'sb-user': session?.user,
    'sb-access-token': session?.access_token,
    'sb-refresh-token': session?.refresh_token
  })

  if (event.url.pathname === cookieRoute) {
    /* Handle request to the configured cookie route - /api/supakit by default */

    if (event.request.method === 'POST') {
      if (session) {
        const response = new Response(null)
        cookiesToSet.forEach(([name, value]) => {
          response.headers.append('set-cookie', event.cookies.serialize(name, JSON.stringify(value), cookieOptions))
        })
        return response
      } else {
        return new Response('Expecting JSON body, but body was null.', { status: 400 })
      }
    } else if (event.request.method === 'DELETE') {
      const response = new Response(null, { status: 204 })
      const expireOptions = {
        ...cookieOptions,
        maxAge: -1
      }
      cookiesToSet.forEach(([name]) => {
        response.headers.append('set-cookie', event.cookies.serialize(name, '', expireOptions))
      })
      return response
    }
  }

  return await resolve(event)
}) satisfies Handle
