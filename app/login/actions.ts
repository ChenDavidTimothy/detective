'use server'

import { normalizeAuthError } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase-admin'
import { revalidatePath } from 'next/cache'

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard'

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return {
        error: {
          message:
            'Your email has not been verified. Please check your inbox and click the verification link.',
        },
      }
    }
    return { error: normalizeAuthError(error) }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: returnTo }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard'

  if (!isValidEmail(email)) {
    return {
      error: { message: 'Please enter a valid email address' },
    }
  }

  try {
    // Fetch all users (first page) and filter for the email
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (!authError && authData?.users?.length) {
      const exactMatch = authData.users.find(
        (user) => user.email?.toLowerCase() === email
      )
      if (exactMatch) {
        const provider = exactMatch.app_metadata?.provider || 'email'
        let errorMessage = 'Email already exists. Please sign in instead.'
        if (provider === 'google') {
          errorMessage += ' You previously signed up with Google.'
        }
        return { error: { message: errorMessage } }
      }
    }

    // Fallback: check users table directly
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1)

    if (!checkError && existingUsers?.length) {
      return {
        error: { message: 'Email already exists. Please sign in instead.' },
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(
          returnTo
        )}`,
      },
    })

    if (error) {
      if (
        error.message.includes('already') ||
        error.message.includes('exist')
      ) {
        return {
          error: { message: 'Email already exists. Please sign in instead.' },
        }
      }
      return { error: normalizeAuthError(error) }
    }

    if (data?.user && !data.user.email_confirmed_at) {
      return {
        success: true,
        redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
      }
    }

    revalidatePath('/', 'layout')
    return { success: true, redirectTo: returnTo }
  } catch (error) {
    return { error: normalizeAuthError(error) }
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: { message: 'Email is required' } }
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })

    if (error) {
      return { error: normalizeAuthError(error) }
    }

    return { success: true }
  } catch {
    return { error: { message: 'Failed to send reset email' } }
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string

  if (!password) {
    return { error: { message: 'Password is required' } }
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: {
          message:
            'Authentication error. Please try the password reset link again.',
        },
      }
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { error: normalizeAuthError(error) }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { error: { message: 'Failed to update password' } }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  return { success: true }
}