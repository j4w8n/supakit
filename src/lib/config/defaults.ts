const config = {
  supakit: {
    cookie: {
      options: {
        maxAge: 1000 * 60 * 60 * 24 * 365
      },
      route: '/supakit'
    }
  }
}

export { config }
