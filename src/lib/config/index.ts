import defaults from './defaults.js'
import { merge } from './utils.js'
import type { SupakitConfig, UserConfig } from 'supakit'

let config: SupakitConfig

export const getConfig = async (): Promise<SupakitConfig> => {
  console.log(config ?? defaults)
  return config ?? defaults
}

export const setConfig = (value: UserConfig): void => {
  if (typeof value !== 'object') throw new Error('config must be an object')
  /**
   * TODO: validate config before merging
   */

  config = merge(defaults, value)
}
