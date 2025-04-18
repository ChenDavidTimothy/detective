'use server'

import { normalizeAuthError } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/supabase-admin'
import { revalidatePath } from 'next/cache'
import { tryCatch, Result, isSuccess } from '@/utils/result'
// Removed the unused User import

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface LoginResult {
  success: boolean;
  redirectTo?: string;
  error?: {
    message: string;
  };
}

const checkEmailExists = async (email: string): Promise<Result<{ exists: boolean; provider?: string }>> => {
  const supabaseAdmin = await createAdminClient();
  
  // Check auth.users first
  const authResult = await tryCatch(
    new Promise<{ exists: boolean; provider?: string }>((resolve, reject) => {
      supabaseAdmin.auth.admin.listUsers()
        .then(({ data: authData, error: authError }) => {
          if (authError) {
            reject(authError);
            return;
          }

          if (authData?.users?.length) {
            const exactMatch = authData.users.find(
              (user) => user.email?.toLowerCase() === email
            );
            if (exactMatch) {
              resolve({
                exists: true,
                provider: exactMatch.app_metadata?.provider || 'email',
              });
              return;
            }
          }

          resolve({ exists: false });
        });
    })
  );

  if (isSuccess(authResult)) {
    return authResult;
  }

  // Fallback to public.users check
  return tryCatch(
    new Promise<{ exists: boolean; provider?: string }>((resolve, reject) => {
      supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }

          resolve({
            exists: !!data?.length,
            provider: data?.length ? 'unknown' : undefined,
          });
        });
    })
  );
};

export async function login(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard'

  // First check if the email exists and its provider
  const emailCheck = await checkEmailExists(email)
  if (isSuccess(emailCheck)) {
    if (!emailCheck.data.exists) {
      return {
        success: false,
        error: {
          message: 'No account found with this email. Please sign up instead.',
        },
      }
    }
    
    if (emailCheck.data.provider === 'google') {
      return {
        success: false,
        error: {
          message: 'This email is associated with a Google account. Please sign in with Google instead.',
        },
      }
    }
  }

  const result = await tryCatch(
    supabase.auth.signInWithPassword({
      email,
      password,
    })
  )

  if (!isSuccess(result)) {
    if (result.error.message.includes('Email not confirmed')) {
      return {
        success: false,
        error: {
          message:
            'Your email has not been verified. Please check your inbox and click the verification link.',
        },
      }
    }
    return { success: false, error: normalizeAuthError(result.error) }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: returnTo }
}

export async function signup(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient()
  // Removed the unused supabaseAdmin variable since it's not used below

  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard'

  if (!isValidEmail(email)) {
    return {
      success: false,
      error: { message: 'Please enter a valid email address' },
    }
  }

  const emailCheck = await checkEmailExists(email)
  if (isSuccess(emailCheck) && emailCheck.data.exists) {
    const provider = emailCheck.data.provider
    let errorMessage = 'Email already exists. Please sign in instead.'
    if (provider === 'google') {
      errorMessage += ' You previously signed up with Google.'
    }
    return { success: false, error: { message: errorMessage } }
  }

  const result = await tryCatch(
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(
          returnTo
        )}`,
      },
    })
  )

  if (!isSuccess(result)) {
    if (
      result.error.message.includes('already') ||
      result.error.message.includes('exist')
    ) {
      return {
        success: false,
        error: { message: 'Email already exists. Please sign in instead.' },
      }
    }
    return { success: false, error: normalizeAuthError(result.error) }
  }

  if (result.data.data?.user && !result.data.data.user.email_confirmed_at) {
    return {
      success: true,
      redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: returnTo }
}

export async function resetPassword(formData: FormData): Promise<LoginResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { success: false, error: { message: 'Email is required' } }
  }

  const result = await tryCatch(
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
    })
  )

  if (!isSuccess(result)) {
    return { success: false, error: normalizeAuthError(result.error) }
  }

  return { success: true }
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