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
  }
}
```

You can override the defaults by creating a `supakit.config.js` file in the root of your project.

- `supakit > cookie > options` takes any of the [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts)
- `supakit > cookie > route` is where our `state` module sends a post-auth Supabase session, for setting and expiring cookies. Our `cookies` module handles setting and expiring cookies for you; but if you'd like to set a different route and/or handle cookies yourself, you can set the path here.

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

Then import and use the below modules, inside the appropriate project files.

## Client-side Modules

### clients

> You need to use this module if you intend to use the `state`, `cookies`, or `client` modules.

This sets up the Supabase clients and exports them. The Supabase URL and ANON KEY are pulled from SvelteKit's `$env/dynamic/public`. The `supabaseClient` has the `autoRefreshToken` and `persistSession` options set to `false`.

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

This manages a secure session store, and exports `initStore()` and `getStore()`. If you pass the store into the `state` module, Supakit will automatically hydrate the store, post-login/logout, with the returned Supabase `session.user` info or `null`.

Only call `initStore()` once - usually in a layout file. You can destructure the session store for immediate use. To use the session store elsewhere, destructure it using `getStore()`.

Usage examples:

```js
/* +layout.svelte */
<script>
  import { page } from '$app/stores'
  import { initStore } from 'supakit'

  const { session } = initStore()

  $session = $page.data.session
</script>
```
```js
/* +page.svelte */
<script>
  import { getStore } from 'supakit'
  const { session } = getStore()
</script>

{#if $session}
  <h4>Your id is {$session.id}</h4>
{/if}
```

### state

This module depends on the `clients` module.

Handles logic for Supabase's `onAuthStateChange()`. `state` fetches a route, which is configurable, when the `SIGN_IN` and `SIGN_OUT` events fire. It optionally takes in a writable store (typed for Supabase's User type) or `null`, and a callback function which receives the Supabase `event` and `session` if you need to do additional work post-login/logout.

Here's a usage example. Perhaps a bit confusing, notice our store name is `session`; but the callback is also receiving `session`, which is returned from Supabase's `onAuthStateChange()`.

```js
<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { initStore, state } from 'supakit'

  const { session } = initStore()

  $session = $page.data.session

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
import { auth } from 'supakit'

export const handle = auth
```
```js
import { sequence } from '@sveltejs/kit/hooks'
import { auth } from 'supakit'

export const handle = sequence(auth, yourHandler)
```
```js
import { sequence } from '@sveltejs/kit/hooks'
import { cookies, locals } from 'supakit'

export const handle = sequence(cookies, locals, yourHandler)
```
