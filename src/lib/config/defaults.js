const defaults = {
  supakit: {
		sessionStore: false,
    cookie: {
      options: {
        maxAge: 14400
      },
      route: '/api/supakit'
    }
	}
}

export default defaults