import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from "@sveltejs/kit"
import './ambient'

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

export type StateChange = (store?: Writable<User | null> | null, callback?: StateChangeCallback | null) => void
