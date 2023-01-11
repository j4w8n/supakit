/// <reference types="@sveltejs/kit" />

declare module '$supakit/config' {
	import type { SupakitConfig } from 'supakit'
  /**
   * A function which returns the merged result of the default configuration, 
   * and any user-supplied configuration via `supakit.config.js` in the project's root directory.
   */
  export function getConfig(): SupakitConfig
}

declare module 'supakit/vite' {
	import { Plugin } from 'vite'

	/**
	 * Returns the Supakit Vite plugin.
	 */
  export function supakit(): Promise<Plugin>
}

/**
 * Declare Supakit's typings for SvelteKit's interfaces
 */
namespace App {
	interface Locals {
		session: {
			user: string | null
			access_token: string | null
			refresh_token: string | null
		}
	}
}