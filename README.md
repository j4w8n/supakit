# Supakit

A Supabase auth helper for SvelteKit (in beta)

## Caveats

- I've only done local tests with the GitHub OAuth login.
- You need to provide your own signIn and signOut functions.
- The Supabase clients rely on `$env/dynamic/public`. This is to make Supakit compatible with various adapters like netlify, vercel, and static.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`


## Setup

Create an `.env` file in the root of your project, with your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` values; and/or ensure these are set on your deployment platform.

## Bare Minimum

After setup, the following code will get you going. For more reading and options, checkout out the modules further below.

```js
/* hooks.server.ts */
import { supakitAuth } from 'supakit'

export const handle = supakitAuth
```
```html
<!-- +layout.svelte -->
<script>
  import { supabaseBrowserClient, supabaseAuthStateChange } from 'supakit'

  supabaseAuthStateChange()

  /* use the supabase client */
  const { data, error } = await supabaseBrowserClient.from('table').select('column')
</script>
```
```js
/* some server-side file */
import { supabaseServerClient } from 'supakit'

/* use the supabase client */
const { data, error } = await supabaseServerClient.from('table').select('column')
```

> Supabase user info will be available in `locals.session.user` on the server-side, and `$page.data.session` on the client-side.

## Client-side

Supakit will set these three browser cookies. They're automatically updated when the session is refreshed.

- `sb-user`
- `sb-access-token`
- `sb-refresh-token`

### getSession()

Manages a secure, writable session store (with Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) feature). If you pass the store into `supabaseAuthStateChange()`, Supakit will automatically hydrate the store with the returned Supabase `session.user` info (or `null` if logged out).

Usage example:

```html
<!-- +layout.svelte -->
<script>
  import { page } from '$app/stores'
  import { getSession } from 'supakit'

  const session = getSession()

  $session = $page.data.session
</script>
```
```svelte
<!-- +page.svelte -->
<script>
  import { getSession } from 'supakit'
  const session = getSession()
</script>

{#if $session}
  <h4>Your id is {$session.id}</h4>
{/if}
```

### supabaseAuthStateChange()

Handles logic for Supabase's `onAuthStateChange()`. It optionally takes in a writable store or `null`, and a callback function which receives the Supabase `event` and `session` if you need to do additional work post-login/logout - such as redirects. You can pass in your own store, or use Supakit's [store](#getSession).

If you pass in a store, the returned Supabase `session.user` info is available in the store immediately after login and logout. This is handy if you don't want to use SvelteKit's `invalidate()` or `invalidateAll()` methods.

Here is a usage example:

```html
<!-- +layout.svelte -->
<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getSession, supabaseAuthStateChange } from 'supakit'

  /* We're using `localSession` here, to differentiate between Supabase's returned session */
  const localSession = getSession()

  $localSession = $page.data.session

  supabaseAuthStateChange(localSession, ({ event, session }) => {
    /* post login and/or logout code */

    /* redirect example */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```

## Server-side

Supakit will set the following. Note the values will always exist; it's a matter of if there's an actual value or just `null`.
```js
event.locals.session = {
  user: cookies['sb-user'],
  access_token: cookies['sb-access-token'],
  refresh_token: cookies['sb-refresh-token']
}
```

### supakitAuth()

Usage examples:

```js
/* hooks.server.ts */
import { supakitAuth } from 'supakit'

export const handle = supakitAuth
```

Or if you're also using your own handlers:
```js
/* hooks.server.ts */
import { sequence } from '@sveltejs/kit/hooks'
import { supakitAuth } from 'supakit'

export const handle = sequence(supakitAuth, yourHandler)
```

## Protecting Page Routes

Sometimes you want a user to be logged in, in order to access certain pages.

Here is our example file structure, where routes `/admin` and `/app` should be protected. We place these routes under a layout group, so they can share a `+layout.server.ts` file. However, this isn't required unless you need shared/cached data across pages under the group.
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

When using a `+layout.server.ts` file, first check for a null `locals.session.user` before using a Supabase server client. You can also check `locals.session.access_token` or `locals.session.refresh_token`. We do this because without the presence of cookies, `supabaseServerClient` is undefined. The Supabase client is only initialized if the `sb-access-token` cookie has a non-`null` value.

```js
/* src/routes/(auth)/+layout.server.ts */
import { redirect } from '@sveltejs/kit'
import { supabaseServerClient } from 'supakit'

/**
 * 
 * @type {import('./$types').LayoutServerLoad}
 */
export const load = async ({ locals }) => {
  if (!locals.session.user) throw redirect(307, '/login')

  /* grab info to return */
  let { data, error } = await supabaseServerClient.from('table').select('column')

  return {
    stuff: data.stuff
  }
}
```

### During Client-side Navigation

Protect pages using a `+page.server.ts` file for each page route. This is needed because `+layout.server.ts` will not necessarily run on every request. This method works for both client-side and server-side requests, because it causes `handle()` to be called in `hooks.server.ts` for `{route}/__data.json`.

To be clear, the server is called in this process; therefore we have opted out of true client-side navigation. However, this does not cause the page to be server re-rendered; as SvelteKit is only calling the server to re-run the page `load()` function.

```js
/* src/routes/(auth)/app/+page.server.ts */
import { redirect } from '@sveltejs/kit'

/**
 * 
 * @type {import('./$types').PageServerLoad}
 */
export const load = async ({ locals }) => {
  if (!locals.session.user) throw redirect(307, '/login')
}
```
