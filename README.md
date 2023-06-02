# Supakit
A Supabase auth helper for SvelteKit. Relies on browser cookies.

## Differences from the official Supabase Sveltekit auth helper
- Uses `httpOnly` cookie storage, for tighter security against XSS. This includes CSRF protection for the endpoints that Supakit creates.<sup>[1](#httponly-cookie-exception)</sup>
- Offers a secure client-side "session" store, which is hydrated with Supabase session info after most auth events. This helps with immediate reactivity after these events occur.
- Saves the `provider_token` and `provider_refresh_token` in their own `httpOnly` cookies. These values are also available in `event.locals.session`. Please note that Supakit will not refresh these tokens for you.
- Option to not use server-side features.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`

## Bare Minimum

We are assuming two things with our examples:

1. You're using Typescript and generating database types to $lib/database.d.ts
2. Your Supabase client is defined in $lib/client.ts

### Environment
Create an `.env` file in the root of your project, with your `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` values; and/or ensure these are set on your deployment platform.

### Types
Per [Supabase docs](https://supabase.com/docs/reference/javascript/typescript-support), you can also add your database types to your client. For other options, beside linking, checkout the [docs](https://supabase.com/docs/reference/cli/supabase-gen-types-typescript).

In your local CLI:
```
supabase link --project-ref <project-id>
supabase gen types typescript --linked > src/lib/database.d.ts
```

Ensure your app.d.ts file includes the following.

> `cookie_options` is only needed if you plan to set additional cookies on the server-side and wanna use Supakit's cookie options. You'll need to install `@types/cookie` as a dev dependency. See [Cookie Options](#cookie-options) to learn how to change the defaults.

```ts
/* src/app.d.ts */
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { Database } from '$lib/database.d'
import { CookieSerializeOptions } from '@types/cookie'

declare global {
  namespace App {
    interface Locals {
      cookie_options: CookieSerializeOptions;
      session: Session | null;
      supabase: SupabaseClient<Database>;
    }
    interface PageData {
      session: Session | null;
    }
  }
}
```

### Browser client
We're using `$env/dynamic` in the example, but you can also use `$env/static` if it's a better fit for your use-case.

```ts
/* src/lib/client.ts */
import { env } from '$env/dynamic/public'
import { createBrowserClient } from 'supakit'
import type { Database } from '$lib/database.d'

export const supabase = createBrowserClient<Database>(
  env.PUBLIC_SUPABASE_URL,
  env.PUBLIC_SUPABASE_ANON_KEY
)
```

### Declare onAuthStateChange
You'll need to pass-in your Supabase browser client as the first parameter.

```html
<!-- +layout.svelte -->
<script lang="ts">
  import { supabaseAuthStateChange } from 'supakit'
  import { supabase } from '$lib/client'
  import { onMount } from 'svelte'

  onMount(() => {
    supabaseAuthStateChange(supabase)
  })
</script>
```

### Server hooks
Handles cookies, setting `event.locals`, and initializing the Supabase server client.

```ts
/* hooks.server.ts */
import { supakit } from 'supakit'

export const handle = supakit
```

#### Supakit Lite
If you don't want Supakit to handle server-side features like populating `event.locals` and creating a server client, then you can use a different import which will only handle setting browser cookies.

```ts
/* hooks.server.ts */
import { supakitLite } from 'supakit'

export const handle = supakitLite
```

#### Using Supakit with your own handlers
If you wanna take advantage of Supakit's cookies, event.locals, and/or server client in your handler, be sure to declare `supakit` first in your sequence.

```ts
/* src/hooks.server.ts */
import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'
import { supakit } from 'supakit'

const yourHandler = (async ({ event, resolve }) => {
  /* do something */

  return await resolve(event)
}) satisfies Handle

export const handle = sequence(supakit, yourHandler)
```

### Server-side usage
The built-in Supabase server client relies on `$env/dynamic/public`. It also sets `persistSession`, `autoRefreshToken` and `detectSessionInUrl` to `false`. The currently logged-in user is automatically "signed in" to this client; so any further auth calls, like `getSession()`, `updateUser()`, etc will work on the server-side - just be aware that no `onAuthStateChange()` events will reach the browser client; nor will any updated data sync with the client-side, until the next server request.

```ts
/* some server-side load file, for example +layout.server.ts */
export const load = ({ locals: { session, supabase } }) => {
  const { data, error } = await supabase.from('table').select('column')

  return {
    stuff: data,
    session
  }
}
```

### Locals
Supakit sets the following `event.locals`:

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

/* If you want to set your own cookies on the server-side, and use Supakit's or your custom options */
event.locals.cookie_options
```
> `expires_in` will get calculated, and reflect how many seconds are left until your `access_token` expires. `expires_at` is taken directly from the jwt. Keep in mind that these two values are only updated when the `handle` function is called in `hooks.server.ts`; so don't rely on them for realtime info.

## Further Reading and Options

### Supabase client options
Pass in an object of `SupabaseClientOptions`, with a couple of exceptions, as the third parameter to `createBrowserClient`.

Supakit does not support passing in `auth` options, except `storage` and `storageKey`.

Example:
```ts
/* src/lib/client.ts */
import { env } from '$env/dynamic/public'
import { createBrowserClient } from 'supakit'
import type { Database } from '$lib/database.d'

export const supabase = createBrowserClient<Database>(
  env.PUBLIC_SUPABASE_URL,
  env.PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        'Custom-Header': 'value'
      }
    },
    auth: {
      storage: yourCustomStorage,
      storageKey: 'your-key'
    }
  }
)
```

### Session Store
`getSessionStore()` is a secure, session store using Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) API. If you pass the store into `supabaseAuthStateChange()`, Supakit will automatically hydrate the store with the returned Supabase `session` info after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events - giving you immediate reactivity for any part of your app that relies on the value of the store.

To hydrate the store during initial load and page refreshes, you can populate the store with returned server data.

Setup
```html
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { getSessionStore, supabaseAuthStateChange } from 'supakit'
  import { supabase } from '$lib/client'

  export let data
  const session_store = getSessionStore()

  /**
   * data.session assumes you return `session` from a file 
   * like +layout.server.ts or +layout.ts with code such as:
   * return {
   *   session: event.locals.session
   * }
   */
  $session_store = data.session

  onMount(() => {
    supabaseAuthStateChange(supabase, session_store)
  })
</script>
```
Page Usage
```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { getSessionStore } from 'supakit'
  const session_store = getSessionStore()
</script>

{#if $session_store}
  <h4>Your id is {$session_store.user.id}</h4>
{/if}
```

> You can't effectively use this store for other purposes, like writing your own data to it, as the store's value will be overwritten after certain events and during server requests.

### Auth State
`supabaseAuthStatChange()` handles logic for Supabase's `onAuthStateChange()`. A Supabase client is required to be passed-in. Then it takes an optional Svelte store, and a callback function. The callback function receives the Supabase `{ event, session }` object as a parameter, for doing additional work after an auth event.

If you pass in a store, Supakit will hydrate it with the Supabase session after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events.

Type: 
```ts
supabaseAuthStateChange(
  client: SupabaseClient, 
  store?: Writable<Session | null> | null, 
  callback?: (({ event, session }: { event: string, session: Session | null }) => void)
)
```

Example:
```html
<!-- +layout.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { getSessionStore, supabaseAuthStateChange } from 'supakit'
  import { supabase } from '$lib/client'

  export let data
  const session_store = getSessionStore()

  /**
   * data.session assumes you return `session` from a file 
   * like +layout.server.ts or +layout.ts with code such as:
   * return {
   *   session: event.locals.session
   * }
   */
  $session_store = data.session

  onMount(() => {
    supabaseAuthStateChange(supabase, session_store, ({ event, session }) => {
      /* put your post auth event code here */
    })
  })
</script>
```

### Cookies
Supakit will set upto four cookies.

- `sb-<supabase_project_id>-auth-token`
- `sb-provider-token`
- `sb-provider-refresh-token`
- `sb-<crypto.randomUUID()>-csrf`

`sb-<supabase_project_id>-auth-token`, or your custom storage key, is updated after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events. The provider cookies will only be set after the initial `SIGNED_IN` event, and will need to be refreshed and updated by you. The csrf cookie is a session cookie, used to help secure the `/supakit` endpoint for cookie storage; and you may notice more than one.

Setting httpOnly cookies is done by making route requests to the server, then returning a response with the `set-cookie` header. These requests are handled programmatically by Supakit. There is no need for you to create routes for this purpose.

Supakit maintains a session cache inside it's custom `CookieStorage`. When retrieving a user session, for a call like `supabase.auth.getSession()` for example, Supakit will return the cached response as long as the session is not `null`; saving a trip to the server.

> Supakit uses the special, programmed routes `/supakit` and `/supakitCSRF` to handle cookies. Therefore, you should not have a top-level route with the same name (not that anyone would, but).

#### httpOnly Cookie Exception
Because Supakit uses secure httpOnly cookie storage: setting, getting, and deleting the session requires a request to the server. This causes a delay between sending the request, receiving the response, and finally setting the cookie in the browser. This can cause a timing issue after a user logs in for the first time; specifically if you have callback code for `supabaseAuthStateChange()`. To work around this, Supakit will set a non-httpOnly cookie which expires in 5 seconds. This allows any callback, or other affected, code to send the temporary cookie `sb-temp-session` to the server, so that the server will know someone is logged in. This cookie exists in the browser, until it's closed; but once it has expired, it cannot be accessed via XSS attacks.

For the same reasons, Supakit will also set a non-httpOnly cookie of `sb-<crypto.randomUUID()>-csrf`; to help with CSRF protection during an initial page load or refresh. 

#### Cookie Options
You can set your own options, via `createBrowserClient`, by passing in an object of `SecureCookieOptions` - which is just [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts) minus `httpOnly`, since Supakit relies on `httpOnly` being `true`. Whatever you pass in will be merged with the defaults - overriding when appropriate.

Type:
```ts
type SecureCookieOptions = Omit<CookieSerializeOptions, "httpOnly">
```

Supakit Defaults:
```js
{ 
  path: '/',
  maxAge: 60 * 60 * 24 * 365 // one year
}
```

Example:
```ts
/* src/lib/client.ts */
import { env } from '$env/dynamic/public'
import { createBrowserClient } from 'supakit'
import type { Database } from '$lib/database.d'

export const supabase = createBrowserClient<Database>(
  env.PUBLIC_SUPABASE_URL,
  env.PUBLIC_SUPABASE_ANON_KEY,
  {}, // a Supabase client options object is the third parameter
  {
    maxAge: 60 * 60 * 24 * 365 * 100,
    sameSite: 'strict'
  }
)
```

> By default SvelteKit sets `httpOnly` and `secure` to `true`, and `sameSite` to `lax`.
> The only exception, for passing in your own cookie options, is that we discourge setting `httpOnly`. Supakit relies on this value to be `true` for better cookie security. Typescript will show an error if you try to pass it in.

If you need to set cookies yourself, you can import `getCookieOptions()` or use `event.locals.cookie_options` if available.

Examples:
```ts
import { getCookieOptions } from 'supakit'

const cookie_options = getCookieOptions()
```

```ts
/* some server-side file with locals available */
export const yourHandler = (async ({ event, resolve }) => {
  if ('some check') {
    const response = new Response(null)
    response.headers.append('set-cookie', event.cookies.serialize(`cookie-name`, token, event.locals.cookie_options))
    return response
  }

  return await resolve(event)
}) satisfies Handle
```

## Protecting Routes

Sometimes you want a user to be logged in, in order to access certain pages.

Here is our example file structure, where routes `/admin` and `/app` should be protected. We place these routes under a layout group, so they can share a `+layout.server.ts` file. However, this isn't strictly required unless you need shared data across pages under the group.

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

### Server-side Layout

When using a `+layout.server.ts` file, check for a null `locals.session`. If there's no session, then the server client won't be authenticated with a user and will act as an anon client.

```js
/* src/routes/(auth)/+layout.server.ts */
import { redirect } from '@sveltejs/kit'

export const load = async ({ locals: { session, supabase } }) => {
  if (!session) throw redirect(307, '/login')

  /* grab info to return */
  let { data, error } = await supabase.from('table').select('column')

  return {
    stuff: data,
    session
  }
}
```

### Server-side and Client-side Page

Protect pages using a `+page.server.ts` file for each page route. This is needed because `+layout.server.ts` will not necessarily run on every request. This method works for both client-side and server-side requests.

```js
/* src/routes/(auth)/app/+page.server.ts */
import { redirect } from '@sveltejs/kit'

export const load = async ({ locals: { session } }) => {
  if (!session) throw redirect(307, '/login')
}
```
