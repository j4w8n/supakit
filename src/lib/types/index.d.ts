import type { User, Session } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'

export type Config = {
  [key: string]: any
  supakit: {
		sessionStore?: boolean;
    cookie?: {
      options?: import('cookie').CookieSerializeOptions;
      route?: RequestInfo | URL;
    }
	}
}

export type StateChangeCallback = ({event, session}: {event: string, session: Session | null}) => void

export type StateChange = (store: Writable<User | null>, callback: StateChangeCallback) => void