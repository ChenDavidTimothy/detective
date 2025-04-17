import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // build our "fresh" response
  const response = NextResponse.next({ request })

  // instantiate Supabase with exactly this request's cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toset) => {
          toset.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // this will auto-refresh your session if expired,
  // and populate response.cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // if it's a protected route and no user, kick them to login
  const publicRoutes = [
    '/',
    '/login',
    '/auth/callback',
    '/verify-email',
    '/reset-password',
    '/update-password',
  ]
  const isPublic = publicRoutes.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  )
  if (!user && !isPublic) {
    const to = request.nextUrl.clone()
    to.pathname = '/login'
    to.searchParams.set('returnTo', request.nextUrl.pathname)
    return NextResponse.redirect(to)
  }

  return response
}