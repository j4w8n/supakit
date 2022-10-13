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

export type Session = 
  | {
    user?: User;
    access_token?: string;
    provider_token?: string;
    refresh_token?: string;
  }
  | null

export type StateChangeReturn = ({event: string, session: Session}) => void