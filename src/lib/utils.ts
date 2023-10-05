import type { CookieOptionTypes, KeyStringObjectAny, KeyStringObjectRegExp, SecureCookieOptionsPlusName, SupakitRegExp } from './types/index.js'
import { getSupabaseLoadClientCookieOptions } from './config/index.js'
import { error, json, text, type RequestEvent } from '@sveltejs/kit'

const regexs: KeyStringObjectRegExp = {
  code_verifier: /^.*-code-verifier$/,
  csrf: /^.*-csrf$/,
  remember_me: /^supakit-rememberme$/,
  auth_token: /^sb-.*-auth-token$/,
  provider_token: /^sb-provider.*token$/
}

export const browserEnv = () => typeof document !== 'undefined'

export const getCookieOptions = (type: CookieOptionTypes, options: SecureCookieOptionsPlusName): {
  expire_cookie_options?: Omit<SecureCookieOptionsPlusName, 'name'>,
  remember_me_cookie_options?: Omit<SecureCookieOptionsPlusName, 'name'>,
  session_cookie_options?: Omit<SecureCookieOptionsPlusName, 'maxAge' | 'expires' | 'name'>
} => {
  const { name, ...rest_cookie_options } = options
  const remember_me_cookie_options = {
    ...rest_cookie_options,
    httpOnly: false
  }
  const { expires, maxAge, ...session_cookie_options } = rest_cookie_options
  const expire_cookie_options = {
    ...options,
    maxAge: -1
  }

  switch (type) {
    case 'expire':
      return { expire_cookie_options }
    case 'remember_me':
      return { remember_me_cookie_options }
    case 'session':
      return { session_cookie_options }
    case 'all':
      return { 
        expire_cookie_options,
        remember_me_cookie_options,
        session_cookie_options
      }
  }
}

export const isAuthToken = (cookie_name: string) => {
  return cookie_name === getSupabaseLoadClientCookieOptions().name || testRegEx(cookie_name, 'auth_token')
}

export const isProviderToken = (cookie_name: string) => {
  return testRegEx(cookie_name, 'provider_token')
}

export const merge = (current: KeyStringObjectAny, updates: KeyStringObjectAny): any => {
  if (updates) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
  }
  return current
}

export const stringToBoolean = (string: string) => {
  switch (string) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return true
  }
}

export const testRegEx = (string: string, type: SupakitRegExp) => {
  for (const key in regexs) {
    if (key === type) return regexs[key].test(string)
  }
  return false
}

export const decodeBase64URL = (value: string): string => {
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

/**
 * CSRF protection, taken from @sveltejs/kit
 */
const isContentType = (request: Request, ...types: string[]) => {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? ''
	return types.includes(type.toLowerCase())
}
const isFormContentType = (request: Request) => {
  return isContentType(
    request,
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  )
}
export const csrfCheck = (event: RequestEvent) => {
  const { request, url } = event
  const forbidden = 
    isFormContentType(request) && 
    (request.method === 'POST' || request.method === 'DELETE' || request.method === 'PUT' || request.method === 'PATCH') && 
    request.headers.get('origin') !== url.origin
  if (forbidden) {
    const csrf_error = error(403, `Cross-site ${request.method} form submissions are forbidden`);
    if (request.headers.get('accept') === 'application/json') {
      return json(csrf_error.body, { status: csrf_error.status })
    }
    return text(csrf_error.body.message, { status: csrf_error.status })
  }
  return false
}
