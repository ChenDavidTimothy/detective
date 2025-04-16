// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Create response object that will be returned regardless of auth success/failure
  const supabaseResponse = NextResponse.next({ request })

  try {
    // Create Supabase client with current request cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Define public routes that should always be accessible
    const isPublicRoute = 
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/reset-password') ||
      request.nextUrl.pathname.startsWith('/update-password') ||
      request.nextUrl.pathname.startsWith('/verify-email') ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/cases') && !request.nextUrl.pathname.includes('/edit');

    // Attempt to get the user, with timeout protection
    try {
      // Set a timeout of 5 seconds for auth request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { data } = await supabase.auth.getUser();
      clearTimeout(timeoutId);
      
      // User is not authenticated and attempting to access protected route
      if (!data?.user && !isPublicRoute) {
        // Redirect to login with return URL
        const returnTo = encodeURIComponent(request.nextUrl.pathname);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', returnTo);
        return NextResponse.redirect(loginUrl);
      }
    } catch (authError) {
      console.error('Auth verification error:', authError);
      
      // Even if auth verification fails, we only redirect on protected routes
      if (!isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'auth_verification_failed');
        return NextResponse.redirect(loginUrl);
      }
    }

    // Return the response with cookies set appropriately
    return supabaseResponse;
  } catch (error) {
    // Catch all unexpected errors to prevent middleware from crashing
    console.error('Middleware unexpected error:', error);
    
    // Add debug header (visible only in development)
    if (process.env.NODE_ENV === 'development') {
      supabaseResponse.headers.set('X-Middleware-Error', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Return original response to avoid blocking the request completely
    return supabaseResponse;
  }
}