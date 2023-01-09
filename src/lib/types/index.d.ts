import type { User, Session } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'

import './ambient.js'

export type SupakitConfig = {
  [key: string]: any
  supakit: {
		sessionStore?: boolean;
    cookie?: {
      options?: CookieSerializeOptions;
      route?: RequestInfo | URL;
    }
    redirects?: {
      login?: RequestInfo | URL;
      logout?: RequestInfo | URL;
    }
	}
}

export type StateChangeCallback = ({event, session}: {event: string, session: Session | null}) => void

export type StateChange = (store?: Writable<User | null> | null, callback?: StateChangeCallback | null) => void
