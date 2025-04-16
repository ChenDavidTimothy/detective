'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { normalizeAuthError } from '@/utils/auth-helpers'

export async function login(formData: FormData) {
    const supabase = await createClient()
  
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  
    if (error) {
      return { error: normalizeAuthError(error) }
    }
  
    revalidatePath('/', 'layout')
    return { success: true }
  }
  

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Check if email exists first (keeping your existing functionality)
  const existsResponse = await fetch('/api/auth/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  
  if (existsResponse.ok) {
    const { exists, provider } = await existsResponse.json()
    
    if (exists) {
      return {
        error: {
          type: 'email-already-exists',
          message: provider === 'google'
            ? "This email is already registered with Google. To use email/password, click 'Forgot password' to set a password for your account."
            : "This email is already registered. Please sign in instead."
        }
      }
    }
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` 
    }
  })

  if (error) {
    return { error: normalizeAuthError(error) }
  }

  if (data?.user && !data.user.email_confirmed_at) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    }
  })

  if (error) {
    return { error: normalizeAuthError(error) }
  }

  return { data }
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
        return { error: { message: error.message } }
      }
      
      return { success: true }
    } catch (err) {
      console.error('Reset password error:', err)
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
      // First, verify the user is authenticated using getUser() for security
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { 
          error: { 
            message: 'Authentication error. Please try the password reset link again.' 
          } 
        }
      }
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        return { error: { message: error.message } }
      }
      
      // Return success instead of redirecting
      revalidatePath('/', 'layout')
      return { success: true }
    } catch (err) {
      console.error('Update password error:', err)
      return { error: { message: 'Failed to update password' } }
    }
  }
  

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    // Don't redirect, just return success status
    revalidatePath('/', 'layout')
    return { success: true }
  }
  
  
