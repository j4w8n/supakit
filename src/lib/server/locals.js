/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const locals = async ({ event, resolve }) => {
  const cookieList = ['sb-user','sb-access-token','sb-provider-token','sb-refresh-token']
  /** 
   * @type {{[key: string]: any}}
   */
  let cookies = {}

  for (let i = 0; i < cookieList.length; i++) {
    cookies[cookieList[i]] = event.cookies.get(cookieList[i]) ? JSON.parse(event.cookies.get(cookieList[i]) || '') : null
  }

  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    provider_token: cookies['sb-provider-token'],
    refresh_token: cookies['sb-refresh-token']
  }

  return await resolve(event)
}