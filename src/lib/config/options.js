const defaults = {
  supakit: {
		sessionStore: false,
    cookie: {
      options: {
        maxAge: 7200
      },
      route: '/api/supakit'
    }
	}
}

export default defaults