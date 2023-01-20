/**
 * Declare Supakit's typings for SvelteKit's interfaces
 */
declare namespace App {
	interface Locals {
		session: {
			user: string | null
			access_token: string | null
			refresh_token: string | null
		}
	}
}
