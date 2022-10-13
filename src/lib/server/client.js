import { initSupabaseServerClient } from '../client/clients'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const client = async ({ event, resolve }) => {
  const token = event.locals.session.access_token

  if (token) {
    initSupabaseServerClient(token)
  }
  
  return await resolve(event)
}