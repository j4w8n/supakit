import './ambient'

import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type CookieOptions = {
  [key: string]: any
}

export type StateChangeCallback = ({event, session}: {event: string, session: Session | null}) => void

export function supakitAuth(): Handle
export function supabaseAuthStateChange(
  store?: Writable<User | null> | null, 
  callback?: (({event, session}: {event: string, session: Session | null}) => void) | null
): void
export function getSession(): Writable<User | null>
export function setCookieOptions({}: CookieSerializeOptions): void
export const supabaseBrowserClient: SupabaseClient
export const supabaseServerClient: SupabaseClient