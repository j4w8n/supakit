/**
 * 
 * @param {string} token 
 */
 export const decode = (token) => {
  const jwt = token.split('.')[1]
  const buffer = Buffer.from(jwt, 'base64')
  return JSON.parse(buffer.toString())
}

/**
 * 
 * @param {import('@sveltejs/kit').RequestEvent} event 
 * @returns {{[key: string]: string}}
 */
export const getCookies = (event) => {
  const cookieList = ['sb-user','sb-access-token','sb-refresh-token']
  /** 
   * @type {{[key: string]: string}}
   */
  let cookies = {}

  for (let i = 0; i < cookieList.length; i++) {
    cookies[cookieList[i]] = event.cookies.get(cookieList[i]) ? JSON.parse(event.cookies.get(cookieList[i]) || '') : null
  }
  return cookies
}