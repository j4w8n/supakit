import type { SupakitConfig } from 'types'

export const merge = (current: SupakitConfig, updates: SupakitConfig): SupakitConfig => {
  if (current) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
    return current
  }
  return updates
}
