import { getConfig } from '$supakit/config'
import type { Plugin } from 'vite'

const config = getConfig()

export function supakit(): Plugin {
  return {
    name: 'rollup-plugin-supakit',

    resolveId(id: string) {
			// treat $supakit/config as virtual
			if (id === '$supakit/config') return `\0${id}`
		},

    async load(id: string) {
			if (id === '\0$supakit/config') {
        //const supakitConfig = await config()
        return `export const config = ${JSON.stringify(config)}`
      }
		}
  }
}
