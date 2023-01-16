import './ambient'

import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type SupakitConfig = {
  [key: string]: any
  supakit: {
    cookie: {
      options: CookieSerializeOptions;
      route: string;
    }
    redirects: {
      login: string | URL | null;
      logout: string | URL | null;
    }
	}
}

export type UserConfig = {
  [key: string]: any
  supakit: {
    cookie?: {
      options?: CookieSerializeOptions;
      route?: string;
    }
    redirects?: {
      login?: string | URL | null;
      logout?: string | URL | null;
    }
	}
}

export type StateChangeCallback = ({event, session}: {event: string, session: Session | null}) => void

export function auth(): Handle
export function locals(): Handle
export function cookies(): Handle
export function client(): Handle
export function state(
  store?: Writable<User | null> | null, 
  callback?: (({event, session}: {event: string, session: Session | null}) => void) | null
): void
export function getSession(): Writable<User | null>
export const supabaseClient: SupabaseClient
export const supabaseServerClient: SupabaseClient