import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

// Ensure NEXT_PUBLIC_APP_URL is defined and has a default fallback
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Provide a sensible default

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If this is a recovery (password reset), redirect to update password page using the canonical APP_URL
      if (type === 'recovery') {
        return NextResponse.redirect(`${APP_URL}/update-password`)
      }
      
      // For other auth flows, redirect to the next page using the canonical APP_URL
      return NextResponse.redirect(`${APP_URL}${next}`)
    }
    
    console.error('Auth callback error:', error)
  }
  
  // If there was an error or no code, redirect to an error page using the canonical APP_URL
  return NextResponse.redirect(`${APP_URL}/login?error=auth_callback_error`)
}