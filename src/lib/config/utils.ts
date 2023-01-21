import type { CookieOptions } from 'supakit'

export const merge = (current: CookieOptions, updates: CookieOptions): CookieOptions => {
  if (updates) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
  }
  return current
}
