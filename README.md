# Supakit
A Supabase auth helper for SvelteKit.

## Differences from the official Supabase Sveltekit auth helper
- Uses `httpOnly` cookie storage, for tighter security against XSS. This includes CSRF protection for the endpoints that Supakit creates.<sup>[1](#httponly-cookie-exception)</sup>
- "Remember Me" feature.
- Set `flowType`, `debug` and `lock` Supabase client options.
- Provides a callback route for server-side auth, so you don't have to setup `exchangeCodeForSession()`.
- Provides a confirm route for server-side token hash otp verification.
- Built-in server client.
- Saves the `provider_token` and `provider_refresh_token` in their own `httpOnly` cookies. These values are also available in `event.locals.session`. Please note that Supakit will not refresh these tokens for you.
- Offers a secure client-side "session" store, which is hydrated with Supabase session info after most auth events. This helps with immediate reactivity after these events occur. The `invalidate()` method is an alternative to this.
- Opt-out of server-side features (client, event.locals); but very uncommon.

## Table of Contents

[Install](#install)

[Setup](#setup)

[Types](#types)

[Load Client](#load-client)

[onAuthStateChange](#auth-state)

[Server Hooks](#server-hooks)

[event.locals](#locals)

[Server Client](#server-client)

[Client and Cookie Options](#client-and-cookie-options)

[Custom Cookies](#custom-cookies)

[Server-side Auth](#server-side-auth)

[Client-side Auth](#client-side-auth)

[Session Store](#session-store)

[Remember Me](#remember-me)

[Protect Routes](#protecting-routes)

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`

## Setup

For the examples, we are assuming that you use Typescript and are generating database types to $lib/database.d.ts

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

> `cookie_options` is only needed if you plan to set additional cookies on the server-side and wanna use Supakit's cookie options; or if you pass in custom cookie options. See [Cookie Options](#cookie-options) to learn how to change the defaults.

```ts
/* src/app.d.ts */
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { Database } from '$lib/database.d'
import { SecureCookieOptionsPlusName } from 'supakit'

declare global {
  namespace App {
    interface Locals {
      cookie_options: SecureCookieOptionsPlusName;
      session: Session | null;
      supabase: SupabaseClient<Database>;
    }
    interface PageData {
      session: Session | null;
      supabase: SupabaseClient<Database>;
    }
  }
}
```

### Load client
Create a Supabase client in your root +layout.ts file. We're using `$env/dynamic` in the example, but you can also use `$env/static` if it's a better fit for your use-case.

This client is available in `data` and `$page.data` in your downstream load functions and pages.

If you want to use SvelteKit's native invalidate method, after session changes, be sure to use `depends` below. Otherwise, you can omit and setup the [session store](#session-store).

Note that SvelteKit's `fetch` must be passed as the third parameter to the client.

```ts
/* src/routes/layout.ts */
import { env } from '$env/dynamic/public'
import { createSupabaseLoadClient } from 'supakit'
import type { Database } from '$lib/database.d'

export const load = async ({ data: { session }, fetch, depends }) => {
  depends('supabase:auth')

  const supabase = createSupabaseLoadClient<Database>({
    supabase_url: env.PUBLIC_SUPABASE_URL, 
    supabase_key: env.PUBLIC_SUPABASE_ANON_KEY,
    fetch
  })

  return { supabase, session }
}
```

### Declare onAuthStateChange
Listen for auth changes in your root +layout.svelte file. You'll need to pass-in your Supabase load client.

If using `depends` to invalidate data after session changes, be sure to setup the callback function. Otherwise, 
reference [auth state](#auth-state) to use Supakit's session store.

```html
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { supabaseAuthStateChange } from 'supakit'
  import { onMount } from 'svelte'

  export let data

  onMount(() => {
    supabaseAuthStateChange({
      client: data.supabase, 
      callback: ({ event, session }) => {
        if (data.session.expires_at !== session.expires_at) invalidate('supabase:auth')
      }
    })
  })
</script>
```

### Server hooks
Handles endpoints, setting `event.locals`, and initializing the Supabase server client.

```ts
/* src/hooks.server.ts */
import { supakit } from 'supakit'

export const handle = supakit
```

#### Supakit Lite
If you don't want Supakit to handle server-side features like populating `event.locals` and creating a server client, then you can use a different import which will only handle setting cookies and the server-side auth callback.

```ts
/* src/hooks.server.ts */
import { supakitLite } from 'supakit'

export const handle = supakitLite
```

### Locals
There's nothing for you to do here, just a heads-up that these are available to use:

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

/**
 * If you want to set your own cookies on the server-side,
 * you can use Supakit's default options - or your custom
 * options, if you've set them (see further below).
 */
event.locals.cookie_options
```
> `expires_in` will get calculated, and reflect how many seconds are left until your `access_token` expires. `expires_at` is taken directly from the jwt. Keep in mind that these two values are only updated when the `handle` function is called in `hooks.server.ts`; so don't rely on them for realtime info.

### Server client
The built-in Supabase server client relies on `$env/dynamic/public`. If there is a logged-in user, they're automatically "signed in" to this client. All you need to do is use the client.

```ts
/* some server-side load file, for example src/routes/+layout.server.ts */
export const load = ({ locals: { session, supabase } }) => {
  const { data, error } = await supabase.from('table').select('column')

  return {
    stuff: data,
    session
  }
}
```

### Client and Cookie Options
If you'd like to set options, pass them into a function at the root of your server hooks.

#### Types
Defaults are shown as the last option.

Client Auth Types:
```ts
auth: {
  flowType?: 'implicit' | 'pkce'
  debug?: true | false
  lock?: LockFunc
}
```
> [LockFunc](https://github.com/supabase/gotrue-js/blob/master/src/lib/types.ts#L53)

You can reference more client options at [SupabaseClientOptions](https://github.com/supabase/supabase-js/blob/master/src/lib/types.ts).

Cookie Type:
```ts
type CookieOptions = Omit<CookieSerializeOptions, "httpOnly">
```

#### Option Defaults
```js
cookie_options = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365
}
client_options = {
  auth: {
    flowType: 'pkce'
  }
}
```

Example:
```ts
/* src/hooks.server.ts */
import { supakit, supabaseConfig } from 'supakit'

supabaseConfig({
  client_options: {
    auth: {
      debug: true
    }
  },
  cookie_options: {
    maxAge: 60 * 60 * 24 * 30
  }
})

export const handle = supakit
```

> By default SvelteKit sets `httpOnly` and `secure` to `true`, and `sameSite` to `lax`.
> Supakit relies on the `httpOnly` value to be `true` for better cookie security. Typescript will show an error if you try to pass it in.

#### Custom Cookies
If you need to set your own cookies, you can import `supabaseConfig` on the client-side or by using `event.locals.cookie_options` on the server-side to get cookie options.

Examples:
```ts
/* client-side */
import { supabaseConfig } from 'supakit'

const { cookie_options } = supabaseConfig().get
```

```ts
/* some server-side file with locals available - example here is a hooks handler */
export const yourHandler = (async ({ event, resolve }) => {
  if ('some check') {
    const response = new Response(null)
    response.headers.append(
      'set-cookie', 
      event.cookies.serialize(`cookie-name`, token, event.locals.cookie_options)
    )
    return response
  }

  return await resolve(event)
}) satisfies Handle
```

### Server-side auth

#### Exchange a code for a session
Supakit provides an endpoint for handling the `exchangeCodeForSession` method; so there's no need to create this route yourself. You can also append the redirectTo url with a `next` parameter for post-auth redirects, e.g.`/app`.

Here we show an example using page actions.
```ts
/* some server-side file, like src/routes/login/+page.server.ts */
export const actions = {
  signin: async ({ request, url, locals: { supabase } }) => {
    const data = await request.formData()
    const provider = data.get('provider') as Provider
    const { data, error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${url.origin}/supakit/callback?next=/app`
      }
    })

    /* handle error */

    if (data.url) throw redirect(303, data.url)
  }
}
```
```html
<!-- some client-side file, like src/routes/login/+page.svelte -->
<form method="POST" action="?/signin">
  <button name="provider" value="github">GitHub</button>
  <button name="provider" value="google">Google</button>
</form>
```

#### Login with a token_hash
This method can be used for the following purposes:
1. Confirm a signup
2. Invite a user
3. Magic Link email signin
4. Reset a password

Be sure to change your email templates per the [Supabase guide](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr#update-email-templates-with-url-for-api-endpoint). When doing so, change any references of `/auth/confirm` to `/supakit/confirm`. Also, change any `next` parameter to the appropriate page on your site.

Magic Link email Example
```js
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com'
})
```
Reset a password Example
```js
const { data, error } = await supabase.auth.resetPasswordForEmail({
  email: 'user@example.com'
})
```

### Client-side auth
If you'd rather sign-in on the client-side, set your client's `flowType` to `implicit` and use typical Supabase sign-in methods.

Load client example:
```ts
/* src/routes/layout.ts */
import { env } from '$env/dynamic/public'
import { createSupabaseLoadClient } from 'supakit'
import type { Database } from '$lib/database.d'

export const load = async ({ data: { session }, fetch, depends }) => {
  depends('supabase:auth')

  const supabase = createSupabaseLoadClient<Database>({
    supabase_url: env.PUBLIC_SUPABASE_URL, 
    supabase_key: env.PUBLIC_SUPABASE_ANON_KEY,
    fetch
  })

  return { supabase, session }
}
```

## Further Reading and Options

### Session Store
`getSessionStore()` is a secure, session store using Svelte's [context](https://svelte.dev/docs#run-time-svelte-setcontext) API. If you pass the store into `supabaseAuthStateChange()`, Supakit will automatically hydrate the store with the returned Supabase `session` info after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events - giving you immediate reactivity for any part of your app that relies on the value of the store.

To hydrate the store during initial load and page refreshes, you can populate the store with returned server data.

Setup
```html
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { getSessionStore, supabaseAuthStateChange } from 'supakit'

  export let data
  const session_store = getSessionStore()

  /**
   * data.session assumes you return `session` from a file 
   * like src/routes/+layout.server.ts with code such as:
   * return {
   *   session: event.locals.session
   * }
   * 
   * and then from src/routes/+layout.ts with code such as:
   * return {
   *   session: data.session
   * }
   */
  $session_store = data.session

  onMount(() => {
    supabaseAuthStateChange({ client: data.supabase, store: session_store })
  })
</script>
```
Page Usage
```svelte
<!-- /src/routes/some/path/+page.svelte -->
<script lang="ts">
  import { getSessionStore } from 'supakit'
  const session_store = getSessionStore()
</script>

{#if $session_store}
  <h4>Your id is {$session_store.user.id}</h4>
{/if}
```

### Auth State
`supabaseAuthStateChange()` handles logic for Supabase's `onAuthStateChange()`. A Supabase client is required to be passed-in. Then it takes an optional Svelte store, and a callback function. The callback function receives the Supabase `{ event, session }` object as a parameter, for doing additional work after an auth event.

If you pass in a store, Supakit will hydrate it with the Supabase session after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events. This option is usually used in lieu of SvelteKit's `invalidate()` and `depends()` functions. Using both methods would be uncommon.

Example:
```html
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { getSessionStore, supabaseAuthStateChange } from 'supakit'

  export let data
  const session_store = getSessionStore()

  /**
   * data.session assumes you return `session` from a file 
   * like src/routes/+layout.server.ts or +layout.ts with code such as:
   * return {
   *   session: event.locals.session
   * }
   */
  $session_store = data.session

  onMount(() => {
    supabaseAuthStateChange({ 
      client: data.supabase, 
      store: session_store, 
      callback: ({ event, session }) => {
        /**
         * Put any post-event code here.
         * 
         * e.g. If you don't use Supakit's session store, then you'll likely want
         * to add the below; as well as change `session_store`, above, to `null`.
         */
        if (data.session.expires_at !== session.expires_at) invalidate('supabase:auth')
      }
    })
  })
</script>
```

### Cookies
Supakit may set the following cookies.

- `sb-<supabase_project_id>-auth-token`
- `sb-provider-token`
- `sb-provider-refresh-token`
- `sb-<crypto.randomUUID()>-csrf`
- `sb-config`
- `supakit-rememberme`

`sb-<supabase_project_id>-auth-token`, or your custom storage key, is updated after the `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, and `USER_UPDATED` events. The provider cookies will only be set after the initial `SIGNED_IN` event, and will need to be refreshed and updated by you. The csrf cookie is a session cookie, used to help secure the `/supakit/cookie` endpoint for cookie storage; and you may notice more than one.

Supakit sets httpOnly cookies by making route requests to the server, then returning a response with the `set-cookie` header. These requests are handled programmatically by Supakit. There is no need for you to create routes for this purpose.

Supakit maintains a session cache inside it's custom `CookieStorage` for the Supabase load client. When retrieving a user session, for a call like `supabase.auth.getSession()` for example, Supakit will return the cached response as long as the session is not `null`; saving a trip to the server.

> Supakit uses the special, programmed routes `/supakit/cookie`, `/supakit/csrf`, `/supakit/confirm`, and `/supakit/config`. Therefore, you should not have a top-level route with the same names (not that anyone would).

#### httpOnly Cookie Exception
Because Supakit uses secure httpOnly cookie storage: setting, getting, and deleting the session requires a request to the server. This causes a delay between sending the request, receiving the response, and finally setting the cookie in the browser. This can cause a timing issue after a user logs in for the first time; specifically if you have callback code for `supabaseAuthStateChange()`. To work around this, Supakit will set a non-httpOnly cookie which expires in 5 seconds. This allows any affected code to send the temporary cookie `sb-temp-session` to the server, so that the server will know someone is logged in. This cookie exists in the browser, until it's closed; but once it has expired, it cannot be accessed via XSS attacks.

### Remember Me
Determines if Supakit remembers a logged-in user or if they are logged out after closing the browser. Defaults to true, whether you use the feature or not.

You can give users the option by adding a checkbox input to your login form, then importing and using the function.

```html
/* src/routes/login/+page.svelte */
<script lang="ts">
  import { rememberMe } from 'supakit'
  import { onMount } from 'svelte'

  let checked: boolean
  onMount(() => {
    checked = rememberMe().value
  })
</script>

<form method="POST" action="?/signin">
  <button name="provider" value="github">Login with GitHub</button>
  <input 
    type="checkbox" id="rememberme" 
    bind:checked 
    on:click={ () => checked = rememberMe().toggle }/>
  <label for="rememberme">Remember Me</label>
</form>
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
