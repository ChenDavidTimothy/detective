'use client'

import { createClient } from '@/utils/supabase/client'

/**
 * Sign in with Google OAuth (client-side action)
 * This must be used in client components only
 */
export async function signInWithGoogle(returnTo = '/dashboard') {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        returnTo
      )}`,
    },
  })
  if (error) throw error
}