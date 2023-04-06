import type { CookieOptions } from './types/index.js'

export const merge = (current: CookieOptions, updates: CookieOptions): CookieOptions => {
  if (updates) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
  }
  return current
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
const is_content_type = (request: Request, ...types: string[]) => {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? ''
	return types.includes(type)
}

export const is_form_content_type = (request: Request) => {
  return is_content_type(
    request,
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  )
}
