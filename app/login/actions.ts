// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = formData.get('returnTo') as string || '/dashboard'
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Provide more specific error for unconfirmed emails
    if (error.message.includes('Email not confirmed')) {
      return { 
        error: { 
          message: 'Your email has not been verified. Please check your inbox and click the verification link.' 
        } 
      }
    }
    return { error }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: returnTo }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const returnTo = formData.get('returnTo') as string || '/dashboard'
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(returnTo)}` 
    }
  })

  if (error) {
    return { error }
  }

  // If email confirmation is required
  if (data?.user && !data.user.email_confirmed_at) {
    return { success: true, redirectTo: `/verify-email?email=${encodeURIComponent(email)}` }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: returnTo }
}

export async function signInWithGoogle(returnTo: string = '/dashboard') {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(returnTo)}`,
    }
  })

  if (error) {
    return { error }
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { 
        error: { 
          message: 'Authentication error. Please try the password reset link again.' 
        } 
      }
    }
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) {
      return { error: { message: error.message } }
    }
    
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
  
  revalidatePath('/', 'layout')
  return { success: true }
}