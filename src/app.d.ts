/// <reference types="@sveltejs/kit" />

import type { SupabaseClient, Session } from "@supabase/supabase-js"
import type { CookieSerializeOptions } from "cookie"

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			supabase: SupabaseClient;
			cookie_options: CookieSerializeOptions;
		}
		// interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

export {}
