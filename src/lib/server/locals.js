import { getCookies } from './utils'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const locals = async ({ event, resolve }) => {
  const cookies = getCookies(event)

  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token']
  }

  return await resolve(event)
}