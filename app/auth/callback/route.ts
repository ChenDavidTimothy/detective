import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  // If we have a code, let's exchange it for a session
  // This is only needed if the middleware somehow didn't handle it
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // Redirect to the specified page
  return NextResponse.redirect(new URL(next, request.url))
}