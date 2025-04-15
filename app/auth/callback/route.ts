import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL('/login?error=unknown', requestUrl.origin)
      );
    }

    // Get session and user
    const { data: { session } } = await supabase.auth.getSession();

    // Set cookie and redirect as normal
    if (session) {
      cookieStore.set('supabase-auth-token', session.access_token, {
        path: '/',
        maxAge: session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
    }

    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  } catch (err) {
    return NextResponse.redirect(
      new URL('/login?error=unknown', requestUrl.origin)
    );
  }
}