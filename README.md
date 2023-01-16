# Supakit

A Supabase auth helper for SvelteKit (in beta)

## Configuration

Here is the default config. You can override the defaults by creating a `supakit.config.js` file in the root of your project.

```js
const config = {
  supakit: {
    cookie: {
      options: {
        maxAge: 14400
      },
      route: '/api/supakit'
    },
    redirects: {
      login: '',
      logout: ''
    }
  }
}

export default config
```

- `supakit > cookie > options` Takes any of the [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts)
- `supakit > cookie > route` Is where our `supabaseAuthStateChange()` module sends a post-auth Supabase session, for setting and expiring cookies. If this setting is changed, you have to create the route and logic; but with the default setting Supakit handles it all.
- `supakit > redirects` If set, the user will be redirected to this page, using SvelteKit's `goto()`, after they login and/or logout.

## Caveats

- I've only done local tests with the GitHub OAuth login.
- You need to provide your own signIn and signOut functions.
- The Supabase clients rely on `$env/dynamic/public`. This is to make Supakit compatible with various adapters like netlify, vercel, and static.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`


## Setup

Enable the Supakit plugin in `vite.config.js`. Note this is imported from `supakit/vite`, not `supakit`.

```js
import { sveltekit } from '@sveltejs/kit/vite'
import { supakit } from 'supakit/vite'

const config = {
  plugins: [sveltekit(), supakit()]
};

export default config;
```

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

Handles logic for Supabase's `onAuthStateChange()`. It optionally takes in a writable store or `null`, and a callback function which receives the Supabase `event` and `session` if you need to do additional work post-login/logout. You can pass in your own store, or use Supakit's [store](#getSession).

If you pass in a store, the returned Supabase `session.user` info is available in the store immediately after login and logout. This is handy if you don't want to use SvelteKit's `invalidate()` or `invalidateAll()` methods.

If you've configured redirects, this module will execute them with `goto()`. See [configuration](#Configuration).

Here are two usage examples:

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
    /* some post login and/or logout code */

    /* then redirect */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```
```html
<!-- +layout.svelte -->
<!-- this example assumes you've set the config for supakit > redirects > login/logout -->
<script>
  import { supabaseAuthStateChange } from 'supakit'

  supabaseAuthStateChange(null, ({ event, session }) => {
    /* some post login and/or logout code */
    /**
     * This is still called, even if you redirect the user post login/logout with the Supakit config.
     * Of course, this assumes you're redirecting them to a location that inherits whatever layout file
     * you place the `supabaseAuthStateChange()` module in.
     */
    console.log('Hello There World!')
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
