import type { Config } from '../exports'

export const merge = (current: Config, updates: Config): Config => {
  if (current) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
    return current
  }
  return updates
}
