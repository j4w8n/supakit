import type { User } from '@supabase/supabase-js';

export type Config = {
  cookieOptions?: import('cookie').CookieSerializeOptions;
  sessionStore?: boolean;
  cookieRoute?: RequestInfo | URL;
}

export type Session = 
  | {
    user?: User;
    access_token?: string;
    provider_token?: string;
    refresh_token?: string;
  }
  | null