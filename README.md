# Supakit
A Supabase auth helper for SvelteKit. In beta, so breaking changes could happen at any time.

## Differences from the official Supabase Sveltekit auth helper
- Uses `httpOnly` cookies, for tighter security against XSS.
- You can use your own Supabase browser client or Supakit's default.
- Offers a writable and secure "session" store, which is hydrated after login/logout. This is also helpful if you don't want to use Sveltekit's invalidate features, but it doesn't keep you from using invalidate.

## Cookie Options
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
// import { supakitAuth } from 'supakit'
import { setCookieOptions } from 'supakit'

setCookieOptions({
  maxAge: 60 * 60 * 24 * 365 * 100,
  sameSite: 'strict'
})

// export const handle = supakitAuth
```

## Caveats
- The provided Supabase server client relies on `$env/dynamic/public`. This is to make Supakit compatible with various adapters like netlify, vercel, and static. A new client is provided for every server request.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`


## Setup
Create an `.env` file in the root of your project, with your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` values; and/or ensure these are set on your deployment platform.

## Bare Minimum
After setup, the following code will get you going. For more reading and options, checkout out the sections further below.

### Setup server hooks
This takes care of cookies, setting `event.locals`, and authenticating your server-side client.

```js
/* hooks.server.ts */
import { supakitAuth } from 'supakit'

export const handle = supakitAuth
```

### Declare onAuthStateChange
Do this using Supakit's custom function. You'll need to pass in a Supabase browser client as the first parameter.

```html
<!-- +layout.svelte -->
<script lang="ts">
  import { supabaseAuthStateChange, supabaseBrowserClient } from 'supakit'

  /* or use your own client */
  // import { supabaseBrowserClient } from '$lib/supabase'

  supabaseAuthStateChange(supabaseBrowserClient)
</script>
```

### Server-side usage
```js
/* some server-side file */
import { supabaseServerClient } from 'supakit'

const { data, error } = await supabaseServerClient.from('table').select('column')
```

### Client-side usage
```html
<!-- some client-side file -->

<script>
  import { supabaseBrowserClient } from 'supakit'

  const { data, error } = await supabaseBrowserClient.from('table').select('column')
</script>
```

### Create your own Supabase browser client
This is optional. By default, Supakit creates a generic Supabase browser client for you. However, if you need to use additional client options, then you can declare your own.

You still have to pass in your own client as the first parameter to `supabaseAuthStateChange()` (see further below).

This goes in a file of your choice. For example, `src/lib/supabase.ts`.

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env } from '$env/dynamic/public'

export const supabaseBrowserClient = createClient(
  env.PUBLIC_SUPABASE_URL || '', 
  env.PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false
    }
  }
)
```

## Session and Cookies
Supakit will set three browser cookies. They're automatically updated when the auth session is refreshed.
- `sb-user`
- `sb-access-token`
- `sb-refresh-token`

Supakit will also set the following `event.locals`. Note the values will always exist; it's a matter of if there's an actual value or just `null`.
```js
event.locals.session = {
  user: cookies['sb-user'],
  access_token: cookies['sb-access-token'],
  refresh_token: cookies['sb-refresh-token']
}
```

> Supakit uses the special route `/supakit` to handle cookies. Therefore, you should not have a top-level route with the same name (not that anyone would, but).

### getSession
This is an optional function.

Manages a secure, writable session store (with Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) feature). If you pass the store into `supabaseAuthStateChange()`, Supakit will automatically hydrate the store with the returned Supabase `session.user` info post-login (or `null` if logged out).

Usage example:

```html
<!-- +layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { getSession } from 'supakit'

  const session = getSession()

  /**
   * Hydrate the store on subsequent loads.
   * This assumes you return `session` from a file like +layout.server.ts or +layout.ts.
   * For example:
   * return {
   *   session: locals.session.user
   * }
   */
  $session = $page.data.session
</script>
```
```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { getSession } from 'supakit'
  const session = getSession()
</script>

{#if $session}
  <h4>Your id is {$session.id}</h4>
{/if}
```

## Auth State
Handles logic for Supabase's `onAuthStateChange()`. It optionally takes in a writable store and a callback function which receives the Supabase `event` and `session` for doing additional work post-login/logout. You can pass in your own store, or use Supakit's [store](#getSession). The first parameter, a supabase client, is required. `null` can be used in place of the second parameter if necessary.

If you pass in a store, Supakit will hydrate it with the returned Supabase `session.user` info immediately after login and logout.

If you've opted to use your own browser client, you still have to pass it in as the first parameter.

Example:
```html
<!-- +layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getSession, supabaseAuthStateChange, supabaseBrowserClient } from 'supakit'

  /* We're using `localSession` here, to differentiate between Supabase's returned session */
  const localSession = getSession()

  $localSession = $page.data.session

  supabaseAuthStateChange(supabaseBrowserClient, localSession, ({ event, session }) => {
    /* some post login and/or logout code */

    /* for example, redirects */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
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

When using a `+layout.server.ts` file, first check for a null `locals.session.user` before using a Supabase server client. You can also check `locals.session.access_token` or `locals.session.refresh_token`. We do this because without the presence of cookies, `supabaseServerClient` is undefined. It's only initialized as a Supabase client if the `sb-access-token` cookie has a non-`null` value.

```js
/* src/routes/(auth)/+layout.server.ts */
import { redirect } from '@sveltejs/kit'
import { supabaseServerClient } from 'supakit'
import type { LayoutServerLoad } from "./$types"

export const load = (async ({ locals }) => {
  if (!locals.session.user) throw redirect(307, '/login')

  /* grab info to return */
  let { data, error } = await supabaseServerClient.from('table').select('column')

  return {
    stuff: data
  }
}) satisfies LayoutServerLoad
```

### During Client-side Navigation

Protect pages using a `+page.server.ts` file for each page route. This is needed because `+layout.server.ts` will not necessarily run on every request. This method works for both client-side and server-side requests, because it causes `handle()` to be called in `hooks.server.ts` for `{route}/__data.json`.

To be clear, the server is called in this process; therefore we have opted out of true client-side navigation. However, this does not cause the page to be server re-rendered; as SvelteKit is only calling the server to re-run the page `load()` function.

```js
/* src/routes/(auth)/app/+page.server.ts */
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals }) => {
  if (!locals.session.user) throw redirect(307, '/login')
}) satisfies PageServerLoad
```
