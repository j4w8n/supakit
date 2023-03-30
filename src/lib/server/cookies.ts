import { getCookieOptions } from '../config/index.js'
import type { Session } from '@supabase/supabase-js'
import type { Handle } from "@sveltejs/kit"

export const cookies = (async ({ event, resolve }) => {
  const cookie_options = await getCookieOptions()

  /* Handle request to Supakit's cookie route */
  if (event.url.pathname === '/supakit') {
    const session: Session | null = event.request.body ? await event.request.json() : null

    if (event.request.method === 'POST') {
      if (session) {
        const response = new Response(null)

        response.headers.append('set-cookie', event.cookies.serialize('sb-session', JSON.stringify(session), cookie_options))
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
      
      response.headers.append('set-cookie', event.cookies.serialize('sb-session', '', expire_options))
      return response
    }
  }

  return await resolve(event)
}) satisfies Handle
