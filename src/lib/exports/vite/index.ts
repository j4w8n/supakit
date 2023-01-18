import { getConfig } from '../../config/index.js'
import type { Plugin } from 'vite'

export function supakit(): Plugin {
  const virtual_module_id = 'supakit:config'
  const resolved_virtual_module_id = `\0${virtual_module_id}`
  return {
    name: 'rollup-plugin-supakit',

    resolveId(id: string) {
			// treat supakit:config as virtual
			if (id === virtual_module_id) return resolved_virtual_module_id
		},
    async load(id: string) {
      const config = await getConfig()
			if (id === resolved_virtual_module_id) {
        return `export const config = ${JSON.stringify(config)}`
      }
		}
  }
}
