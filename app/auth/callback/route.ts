import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If this is a recovery (password reset), redirect to update password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/update-password`)
      }
      
      // For other auth flows, redirect to the next page
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth callback error:', error)
  }
  
  // If there was an error or no code, redirect to an error page
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}