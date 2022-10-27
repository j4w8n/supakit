# Supakit

A Supabase auth helper for SvelteKit (in beta)

Supakit is meant to be as modular as possible. Meaning you can use the whole thing or whatever parts you'd like. There are some exceptions.

## Configuration

Here is the default config:

```js
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
```

You can override the defaults by creating a `supakit.config.js` file in the root of your project.

- `supakit > cookie > options` takes any of the [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts)
- `supakit > cookie > route` is where our `state` module sends a post-auth Supabase session, for setting and expiring cookies. Our `cookies` module handles setting and expiring cookies for you; but if you'd like to set a different route and/or handle cookies yourself, you can set the path here.
- `supakit > redirects` is used for post-login/logout redirection using SvelteKit's `goto()`.

## Caveats

- I've only done local tests with the GitHub OAuth login.
- You need to provide your own signIn and signOut functions.
- The `clients` module uses `$env/dynamic/public`. This is to make Supakit compatible with various adapters like netlify, vercel, and static.

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

Create an `.env` file in the root of your project, with your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` values.

## Bare Minimum

After setup, the following code will get you going. For more reading and options, checkout out the modules further below.

```js
/* hooks.server.js */
import { auth } from 'supakit'

export const handle = auth
```
```html
<!-- +layout.svelte -->
<script>
  import { supabaseClient, state } from 'supakit'

  /** @type {import('supakit/types').StateChange} */
  state()

  /* use the supabase client */
  const { data, error } = await supabaseClient.from('table').select('column')
</script>
```
```js
/* server-side */
import { supabaseServerClient } from 'supakit'

/* use the supabase client */
const { data, error } = await supabaseServerClient.from('table').select('column')
```

> Supabase user info will be available in `locals.session.user` on the server-side.

## Client-side Modules

### clients

> You need to use this module if you intend to use the `state`, `cookies`, or `client` modules.

Essentially, you "use" this module by importing Supakit's two Supabase clients in your code. See examples further below.

Sets up the Supabase clients and exports them. The Supabase URL and ANON KEY are pulled from SvelteKit's `$env/dynamic/public`.

- `supabaseClient` for client-side supabase work.
- `supabaseServerClient` for server-side supabase work.
- `initSupabaseServerClient()`, which takes in a Supabase access_token to authorize the server client. This function is automatically invoked in the Supakit server `client` module; but available for you to use in custom code if desired.

Usage examples:

```html
<!-- +page.svelte -->
<script>
  import { supabaseClient } from 'supakit'
</script>
```
```js
/* +layout.server.js */
import { supabaseServerClient } from 'supakit'
```

### store

Manages a secure session store (with Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) feature), and exports `getSession()`. If you pass the store into the `state` module, Supakit will automatically hydrate the store, post-login, with the returned Supabase `session.user` info (or `null` if logged out).

Usage examples:

```html
<!-- +layout.svelte -->
<script>
  import { page } from '$app/stores'
  import { getSession } from 'supakit'

  const { session } = getSession()

  $session = $page.data.session
</script>
```
```svelte
<!-- +page.svelte -->
<script>
  import { getSession } from 'supakit'
  const { session } = getSession()
</script>

{#if $session}
  <h4>Your id is {$session.id}</h4>
{/if}
```

### state

This module depends on the `clients` module.

Handles logic for Supabase's `onAuthStateChange()`. `state` fetches a "cookie" route, which is configurable, when the `SIGN_IN` and `SIGN_OUT` events fire. It optionally takes in a writable store (typed for Supabase's User type) or `null`, and a callback function which receives the Supabase `event` and `session` if you need to do additional work post-login/logout.

When you pass in Supakit's session store, the returned Supabase `session.user` info is available in the store immediately after login and logout. This is handy if you don't want to use SvelteKit's `invalidate()` or `invalidateAll()` methods.

If you've configured redirects, this module will execute them with `goto()`. See [configuration](#Configuration).

Here's a usage example. Perhaps a bit confusing, notice our store name is `session`; but the callback is also receiving `session`, which is Supabase's returned session post login/logout.

```html
<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getSession, state } from 'supakit'

  const { session } = getSession()

  $session = $page.data.session

  /** @type {import('supakit/types').StateChange} */
  state(session, ({ event, session }) => {
    /* some post login and/or logout code */

    /* then redirect */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```
```html
<script>
  import { goto } from '$app/navigation'
  import { state } from 'supakit'

  /** @type {import('supakit/types').StateChange} */
  state(null, ({ event, session }) => {
    /* some post login and/or logout code */

    /* then redirect */
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```

## Server-side Modules

You can import and call these modules individually, in `hooks.server.js`, or use our convenient `auth` module to execute all three.

### cookies

This module depends on the `clients` module.

Sets the browser cookies on login and logout, from the Supabase `session`.

Supakit will set these three cookies:

- `sb-user`
- `sb-access-token`
- `sb-refresh-token`

### locals

Sets the following. Note the values will always exist; it's a matter of if there's an actual value or just `null`.
```js
event.locals.session = {
  user: cookies['sb-user'],
  access_token: cookies['sb-access-token'],
  refresh_token: cookies['sb-refresh-token']
}
```

### client

This module depends on the `clients` module.

Authorizes `supabaseServerClient` with the `sb-access-token` cookie value.

### auth

Convenienence method for calling the above three. Order is `cookies, locals, client`.

Usage examples:

```js
/* hooks.server.js */
import { auth } from 'supakit'

export const handle = auth
```
```js
/* hooks.server.js */
import { sequence } from '@sveltejs/kit/hooks'
import { auth } from 'supakit'

export const handle = sequence(auth, yourHandler)
```
```js
/* hooks.server.js */
import { sequence } from '@sveltejs/kit/hooks'
import { cookies, locals } from 'supakit'

export const handle = sequence(cookies, locals, yourHandler)
```

## Protecting Page Routes

Sometimes you want a user to be logged in, in order to access certain pages.

Here is our example file structure, where routes `/admin` and `/app` should be protected. We place these routes under a layout group, so they can share a `+layout.server.js` file. However, this isn't required unless you need shared data across pages under the group.
```shell
src/routes/
├ (auth)/
│ ├ admin/
│ │ ├ +page.server.js
│ │ └ +page.svelte
│ ├ app/
│ │ ├ +page.server.js
│ │ └ +page.svelte
│ ├ +layout.server.js
│ └ +layout.svelte
├ login/
│ └ +page.svelte
├ +error.svelte
├ +layout.server.js
├ +layout.svelte
└ +page.svelte
```

### During Layout Server Requests

When using a `+layout.server.js` file, first check for a null `locals.session.user` before using a Supabase server client. You can also check `locals.session.access_token` or `locals.session.refresh_token`. We do this because without the presence of cookies, `supabaseServerClient` is undefined. It's only initialized as a Supabase client if the `sb-access-token` cookie has a non-`null` value.

```js
/* src/routes/(auth)/+layout.server.js */
import { redirect } from '@sveltejs/kit';
import { supabaseServerClient } from 'supakit';

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

Protect pages using a `+page.server.js` file for each page route. This is needed because `+layout.server.js` will not necessarily run on every request. This method works for both client-side and server-side requests, because it causes `handle()` to be called in `hooks.server.js` for `{route}/__data.json`.

To be clear, the server is called in this process; therefore we have opted out of true client-side navigation. However, this does not cause the page to be server re-rendered; as SvelteKit is only calling the server to re-run the page `load()` function.

```js
import { redirect } from '@sveltejs/kit';

/**
 * 
 * @type {import('./$types').PageServerLoad}
 */
export const load = async ({ locals }) => {
  if (!locals.session.user) throw redirect(307, '/login')
}
```
