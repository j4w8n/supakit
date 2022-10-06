import configFn from '../../config/index.js'

/** @return {import('vite').Plugin} */
export function supakit() {
  console.log('running plugin')
  return supakit_plugin()
}

/** @return {import('vite').Plugin} */
function supakit_plugin() {
  return {
    name: 'rollup-plugin-supakit',

    /** @param {string} id */
    resolveId(id) {
			// treat $supakit/config as virtual
			if (id === '$supakit/config') {
        return `\0${id}`
      }
		},

    /** @param {string} id */
    async load(id) {
			if (id === '\0$supakit/config') {
        const config = await configFn()
        return `export const config = ${JSON.stringify(config)}`
      }
		},
  }
}