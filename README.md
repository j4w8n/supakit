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

After setting up the plugin and `.env` file, simply use the below modules.

## Client-side Modules

### clients

> You need to use this module if you intend to use the `state`, `cookies`, or `client` modules.

Essentially, you "use" this module by importing Supakit's two Supabase clients in your code. See examples further below.

Sets up the Supabase clients and exports them. The Supabase URL and ANON KEY are pulled from SvelteKit's `$env/dynamic/public`. The `supabaseClient` has the `autoRefreshToken` and `persistSession` options set to `false`.

- `supabaseClient` for client-side supabase work.
- `supabaseServerClient` for server-side supabase work.
- `initSupabaseServerClient()`, which takes in a Supabase access_token to authorize the server client. This function is automatically invoked in the Supakit server `client` module; but available for you to use in custom code if desired.

Usage examples:

```js
/* +page.svelte */
<script>
  import { supabaseClient } from 'supakit'
</script>
```
```js
/* +layout.server.js */
<script>
  import { supabaseServerClient } from 'supakit'
</script>
```

### store

Manages a secure session store (with Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) feature), and exports `getSession()`. If you pass the store into the `state` module, Supakit will automatically hydrate the store, post-login, with the returned Supabase `session.user` info (or `null` if logged out).

Usage examples:

```js
/* +layout.svelte */
<script>
  import { page } from '$app/stores'
  import { getSession } from 'supakit'

  const { session } = getSession()

  $session = $page.data.session
</script>
```
```js
/* +page.svelte */
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

Here's a usage example. Perhaps a bit confusing, notice our store name is `session`; but the callback is also receiving `session`, which is Supabase's returned session post login/logout.

```js
<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { getSession, state } from 'supakit'

  const { session } = getSession()

  $session = $page.data.session

  /** @type {import('supakit/types').StateChange} */
  state(session, ({ event, session }) => {
    if (event === 'SIGNED_IN') goto('/app')
    if (event === 'SIGNED_OUT') goto('/')
  })
</script>
```

## Server-side Modules

You can import and call these modules individually, in `hooks.server.js`, or use our convenient `auth` module to execute all three.

### cookies

This module depends on the `clients` module.

Sets and refreshes browser cookies. Information comes from the Supabase `session`. On every server request, Supakit will attempt to refresh Supabase cookies if the jwt expires in less than 120 seconds; or has already expired. This means you should keep your cookie `maxAge` at 120 seconds or longer. By default, Supakit sets `maxAge` to 14400 seconds (4 hours).

Supakit will set these three cookies:

- `sb-user`
- `sb-access-token`
- `sb-refresh-token`

### locals

Sets `event.locals.session` equal to the `sb-user` cookie value.

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
