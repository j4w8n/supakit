import type { User, Session } from '@supabase/supabase-js';

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

export type StateChangeCallback = ({event: string, session: Session}) => void