import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('AuthCallback: Processing callback');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    console.log('AuthCallback: Exchanging code for session');
    
    // Create a cookie handler - await it since it returns a Promise
    const cookieStore = await cookies();
    
    // Create a Supabase client directly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('AuthCallback: Error:', error);
      return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
    }

    // Get the new session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Set the session cookie securely
    if (session) {
      cookieStore.set('supabase-auth-token', session.access_token, {
        path: '/',
        maxAge: session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
    }

    // Redirect to the next page if provided, otherwise go to dashboard
    if (next) {
      console.log('AuthCallback: Redirecting to:', next);
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.log('AuthCallback: Success, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  console.log('AuthCallback: No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
