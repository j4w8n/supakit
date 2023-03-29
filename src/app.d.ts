/// <reference types="@sveltejs/kit" />

import { SupabaseClient, Session } from "@supabase/supabase-js"

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		interface Locals {
			session: Session;
			supabase: SupabaseClient | null;
		}
		// interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

export {}
