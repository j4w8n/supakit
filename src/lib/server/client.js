import { createSupabaseServerClient, supabaseClient } from '../clients'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const client = async ({ event, resolve }) => {
  const token = event.locals.session.access_token

  if (token) {
    createSupabaseServerClient(token)
  }
  
  return await resolve(event)
}