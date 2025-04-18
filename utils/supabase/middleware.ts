import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Build our "fresh" response
  const response = NextResponse.next({ request })

  // Instantiate Supabase with exactly this request's cookies
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

  // This will auto-refresh your session if expired,
  // and populate response.cookies
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // Handle potential errors during user retrieval
  // Only log as an error if it's NOT the expected "no session" error
  if (getUserError && getUserError.message !== 'Auth session missing!') { 
    // Alternative check based on common Supabase error structure if message changes:
    // if (getUserError && !(getUserError.__isAuthError && getUserError.status === 400)) { 
    console.error('Middleware getUser unexpected error:', getUserError);
    // Decide if redirect is needed based on the error or route
  }

  // Check if the user exists AND if they are marked as deleted in our public table
  if (user) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('is_deleted')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle in case the profile somehow doesn't exist

      if (profileError) {
        console.error('Middleware profile check error:', profileError);
        // If we can't check the profile, should we deny access? For safety, maybe.
        // Or maybe allow access but log the error? Let's deny for now.
        // Alternatively, we could just proceed if the ban check below is deemed sufficient.
        // For now, let's proceed cautiously and rely on the is_deleted flag check.
      }

      // If the user's profile is marked as deleted, sign them out and redirect
      if (profileData?.is_deleted) {
        console.log(`User ${user.id} detected as deleted in middleware. Signing out.`);
        await supabase.auth.signOut(); // Ensure sign out completes
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('error', 'account-deleted');
        redirectUrl.searchParams.delete('returnTo'); // Clear returnTo
        return NextResponse.redirect(redirectUrl);
      }
    } catch (e) {
      console.error('Middleware unexpected error during profile check:', e);
      // Handle unexpected errors during the check - potentially redirect to login
    }
  }

  // If it's a protected route and no *valid* (non-deleted) user, kick them to login
  const publicRoutes = [
    '/',
    '/login',
    '/auth/callback',
    '/verify-email',
    '/reset-password',
    '/update-password',
    '/cases',
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