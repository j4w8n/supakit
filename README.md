# Supakit

A Supabase auth helper for SvelteKit (beta).

Supakit is meant to be as modular as possible. Meaning you can use the whole thing or whatever parts you'd like.

## Configuration

Here is the default config:

```js
supakit: {
  sessionStore: false,
  cookie: {
    options: {
      maxAge: 14400
    },
    route: '/api/supakit'
  }
}
```

You can override the defaults by creating a `supakit.config.js` file in the root of your project.

- Setting `supakit > sessionStore` to `true` allows you to use our `store` module, which provides a secure `$session` store.
- `supakit > cookie > options` takes any of the [CookieSerializeOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cookie/index.d.ts)
- `supakit > cookie > route` is the where our `state` module sends a post-auth Supabase session to, for setting and expiring cookies. Our `cookies` module handles setting and expiring cookies for you; but if you'd like to set a different route and/or handle cookies yourself, you can set the path here.

## Caveats

- I've only done local tests with the GitHub OAuth login.
- You must provide your own signIn and signOut functions.
- The `clients` module uses `$env/dynamic/public` (in case you'd prefer to use `$env/static/public` in your own client/db code)

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`


## Setup

Enable the Supakit plugin in `vite.config.js`. Note this is imported from `supakit/vite`, not `supakit`.

```js
import { sveltekit } from '@sveltejs/kit/vite';
import { supakit } from 'supakit/vite'

const config = {
	plugins: [sveltekit(), supakit()]
};

export default config;
```

## Modules

### clients

This is a client-side module, which sets up