# Supakit
A Supabase auth helper for SvelteKit. For use with the Supabase javascript client. In beta, so breaking changes could happen at any time.

## Terminology
When we make reference to a "Supabase client" or `supabaseClient`, this is a general term for any non-server client. Therefore, this could also refer to a non-browser client like mobile, web worker, etc.

## Differences from the official Supabase Sveltekit auth helper
- Uses `httpOnly` cookies, for tighter security against XSS.
- You can use your own custom Supabase clients (browser, server, etc) or the clients provided by Supakit.
- Offers a secure client-side "session" store, which is hydrated with Supabase session info after `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events. This helps with immediate reactivity, especially after user signin and signout.
- Easily make server-side calls, like `supabase.auth.refreshSession()` or `supabase.auth.updateUser()`, without having to first call `supabase.auth.setSession(access_token, refresh_token)` yourself. Requires use of Supakit's server-side client. Be aware that any calls which would normally fire an `onAuthStateChange` event will not be received by the client-side Supabase client.
- Saves the `provider_token` and `provider_refresh_token` in `httpOnly` cookies. These values are also available in `event.locals.session`. Please note that Supakit will not refresh these tokens for you; but is hopefully saving you a step when refreshing them on your own.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`

## Setup
Create an `.env` file in the root of your project, with your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` values; and/or ensure these are set on your deployment platform.

## Bare Minimum
After setup, the code in this section will get you working. For more reading and options, checkout the sections further below.

### Types
If using Typescript, add this import, as well as `session` and `supabase` to your app.d.ts file. We also recommend adding `session` to `PageData`, since this is commonly returned.

```ts
import { SupabaseClient, Session } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
      supabase: SupabaseClient | null;
    }
    interface PageData {
      session: Session | null;
    }
  }
}
```

### Server hooks
This takes care of cookies and setting `event.locals` - including setting the server-side client's session.

```js
/* hooks.server.ts */
import { supakitAuth } from 'supakit'

export const handle = supakitAuth
```

### Declare onAuthStateChange
Do this using Supakit's custom function. 

```html
<!-- +layout.svelte -->
<script lang="ts">
  import { supabaseAuthStateChange } from 'supakit'

  supabaseAuthStateChange()
</script>
```

### Server-side usage
The built-in Supabase server client relies on `$env/dynamic/public`. It also sets `persistSession`, `autoRefreshToken` and `detectSessionInUrl` to `false`.

```js
/* some server-side load file, for example +layout.server.ts */
import type { LayoutServerLoad } from "./$types"

export const load = (({ locals: { session, supabase } }) => {
  const { data, error } = await supabase.from('table').select('column')

  return {
    stuff: data,
    session
  }
}) satisfies LayoutServerLoad
```

### Client-side usage
The built-in Supabase client relies on `$env/dynamic/public`. It also sets `persistSession` to false, as the default localStorage is easily vulernable to XSS attacks.

```html
<!-- some client-side file -->
<script>
  import { supabaseClient } from 'supakit'

  const { data, error } = await supabaseClient.from('table').select('column')
</script>
```

## Further Reading and Options

### Create your own Supabase clients
By default, Supakit creates a Supabase client for you. However, if you need to use additional client options, then you can provide your own client. Be sure to pass it in as the first parameter to `supabaseAuthStateChange()`.

We provide a Supabase server client as well, via `event.locals.supabase`; but you're welcome to use your own and disregard `event.locals.supabase` and the `Locals` [type](#types).

### Auth State
Handles logic for Supabase's `onAuthStateChange()`. It optionally takes in a custom Supabase client, Svelte store, and a callback function. The callback function receives the Supabase `{ event, session }` object as a parameter, for doing additional work after an auth event. You can pass in your own store, or use Supakit's [store](#getSession). Only pass-in a Svelte store which is protected by the [context API](https://svelte.dev/tutorial/context-api).

If you pass in a store, Supakit will hydrate it with the Supabase session after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events.

Type: `supabaseAuthStateChange(client | null | undefined, store | null | undefined, callback | null | undefined)`

Example:
```html
<!-- +layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getSession, supabaseAuthStateChange } from 'supakit'

  /* We're using `localSession` here, to differentiate between Supabase's returned session and our "session" store. */
  const localSession = getSession()

  $localSession = $page.data.session

  /* using `null` for the client means you want to use Supakit's built-in Supabase client, instead of your own */
  supabaseAuthStateChange(null, localSession, ({ event, session }) => {
    /* post auth change code */

    /* for example, redirects */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```

### Session and Cookies
In a browser environment, Supakit will set upto three cookies. `sb-session` is updated after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events. The provider cookies will only be set after the initial `SIGNED_IN` event.
- `sb-session`
- `sb-provider-token`
- `sb-provider-refresh-token`

> Supakit uses the special route `/supakit` to handle cookies. Therefore, you should not have a top-level route with the same name (not that anyone would, but).

Supakit will also set the following `event.locals`:

```js
/* Session info from Supabase */
event.locals.session = {
  provider_token,
  provider_refresh_token,
  access_token,
  refresh_token,
  expires_in,
  expires_at,
  token_type,
  user
}

/* Supakit's server-side Supabase client */
event.locals.supabase
```
> `expires_in` will get calculated, and reflect how many seconds are left until your `access_token` expires. Keep in mind this value is only updated when the `handle` function is called in `hooks.server.ts`; so don't rely on it for realtime info.

### getSession
This is an optional function.

Manages a secure, session store (with Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) feature). It has nothing to do with Supabase's `auth.getSession()` call. If you pass a store into `supabaseAuthStateChange()`, Supakit will automatically hydrate the store with the returned Supabase `session` info after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events.

> You can't effectively use this store for other purposes, like writing your own data to it, as the store's value will be overwritten after certain events and upon requests to the server.

Example:

Setup
```html
<!-- +layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { getSession } from 'supakit'

  const session = getSession()

  /**
   * Hydrate the store on subsequent loads.
   * This assumes you return `session` from a file like +layout.server.ts or +layout.ts with code like:
   * return {
   *   session: event.locals.session
   * }
   */
  $session = $page.data.session
</script>
```
Page Usage
```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { getSession } from 'supakit'
  const session = getSession()
</script>

{#if $session}
  <h4>Your id is {$session.user.id}</h4>
{/if}
```

### Cookie Options
You can set your own options by importing `setCookieOptions` into `hooks.server.ts`, then pass in an object of [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts). Whatever you pass in will be merged with the defaults - overriding when appropriate. This function should be declared outside of the `handle` export.

> By default, SvelteKit sets `httpOnly` and `secure` to `true`; and `sameSite` is set to `lax`.

Supakit Defaults:
```js
{ 
  path: '/',
  maxAge: 60 * 60 * 24 * 365 // one year
}
```

Example:
```ts
import { setCookieOptions, supakitAuth } from 'supakit'

setCookieOptions({
  maxAge: 60 * 60 * 24 * 365 * 100,
  sameSite: 'strict'
})

export const handle = supakitAuth
```

## Protecting Page Routes

Sometimes you want a user to be logged in, in order to access certain pages.

Here is our example file structure, where routes `/admin` and `/app` should be protected. We place these routes under a layout group, so they can share a `+layout.server.ts` file. However, this isn't required unless you need shared data across pages under the group.
```shell
src/routes/
├ (auth)/
│ ├ admin/
│ │ ├ +page.server.ts
│ │ └ +page.svelte
│ ├ app/
│ │ ├ +page.server.ts
│ │ └ +page.svelte
│ ├ +layout.server.ts
│ └ +layout.svelte
├ login/
│ └ +page.svelte
├ +error.svelte
├ +layout.server.ts
├ +layout.svelte
└ +page.svelte
```

### During Layout Server Requests

When using a `+layout.server.ts` file, first check for a null `locals.session.user` before using a Supabase server client via `locals.supabase`. You can also check `locals.session.access_token` or `locals.session.refresh_token`. If there's no user, then the server client won't be authenticated to make Supabase requests.

```js
/* src/routes/(auth)/+layout.server.ts */
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from "./$types"

export const load = (async ({ locals: { session, supabase } }) => {
  if (!session) throw redirect(307, '/login')

  /* grab info to return */
  let { data, error } = await supabase.from('table').select('column')

  return {
    stuff: data,
    session
  }
}) satisfies LayoutServerLoad
```

### During Client-side Navigation

Protect pages using a `+page.server.ts` file for each page route. This is needed because `+layout.server.ts` will not necessarily run on every request. This method works for both client-side and server-side requests, because it causes `handle()` to be called in `hooks.server.ts`.

```js
/* src/routes/(auth)/app/+page.server.ts */
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals: { session } }) => {
  if (!session) throw redirect(307, '/login')
}) satisfies PageServerLoad
```
