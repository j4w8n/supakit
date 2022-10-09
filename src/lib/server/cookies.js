import { config } from '$supakit/config'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const cookies = async ({ event, resolve }) => {
  const path = config.supakit.cookie.route
  if (event.url.pathname !== path) {
    return await resolve(event)
  }

  /**
   * @type {import('@supabase/supabase-js').Session | null}
   */
  const session = event.request.body ? await event.request.json() : null

  const cookieList = Object.entries({
    'sb-user': session?.user,
    'sb-access-token': session?.access_token,
    'sb-provider-token': session?.provider_token,
    'sb-refresh-token': session?.refresh_token
  })

  if (event.request.method === 'POST') {
    console.log('trying to set cookies');
    if (session) {
      const response = new Response(null)

      cookieList.forEach(([name, value]) => {
        response.headers.append('set-cookie', event.cookies.serialize(name, JSON.stringify(value), config.supakit.cookie.options))
      })

      return response
    } else {
      return new Response('Expecting JSON body, but body was null.', { status: 400 })
    }
  } else if (event.request.method === 'DELETE') {
    const response = new Response(null, { status: 204 })
    const cookieOptions = {
      ...config.supakit.cookie.options,
      maxAge: -1
    };
    cookieList.forEach(([name, value]) => {
      response.headers.append('set-cookie', event.cookies.serialize(name, '', cookieOptions))
    })

    return response
  }
  return await resolve(event)
}