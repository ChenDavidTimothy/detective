// app/login/actions.ts
'use server'

import { normalizeAuthError } from '@/utils/auth-helpers';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase-admin';
import { revalidatePath } from 'next/cache';

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient(); // Use admin client for checking

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnTo = formData.get('returnTo') as string || '/dashboard';
  
  // Normalize and validate email
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!isValidEmail(normalizedEmail)) {
    return {
      error: { message: 'Please enter a valid email address' }
    };
  }
  
  try {
    // First, check if the email already exists in auth system
    // This is more reliable than checking the public tables
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      filter: { email: normalizedEmail }
    });
    
    if (!authError && authData?.users) {
      // Look for exact match (case insensitive)
      const exactMatch = authData.users.find(
        user => user.email?.toLowerCase() === normalizedEmail
      );
      
      if (exactMatch) {
        // Email already exists in auth system
        const provider = exactMatch.app_metadata?.provider || 'email';
        let errorMessage = 'Email already exists. Please sign in instead.';
        
        if (provider === 'google') {
          errorMessage += ' You previously signed up with Google.';
        }
        
        return { 
          error: { message: errorMessage } 
        };
      }
    }
    
    // As a fallback, also check the users table directly
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .limit(1);
    
    if (!checkError && existingUsers && existingUsers.length > 0) {
      return { 
        error: { message: 'Email already exists. Please sign in instead.' } 
      };
    }
    
    // If we get here, email doesn't exist yet, proceed with signup
    console.log(`Attempting signup for email: ${normalizedEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(returnTo)}` 
      }
    });

    if (error) {
      console.error('Signup error from Supabase:', error);
      
      // Special handling for duplicate email errors that might slip through
      if (error.message.includes('already') || error.message.includes('exist')) {
        return { 
          error: { message: 'Email already exists. Please sign in instead.' }
        };
      }
      
      // Use the normalizeAuthError helper for better error messages
      const normalizedError = normalizeAuthError(error);
      return { error: { message: normalizedError.message } };
    }

    // Check if email confirmation is required
    if (data?.user && !data.user.email_confirmed_at) {
      return { 
        success: true, 
        redirectTo: `/verify-email?email=${encodeURIComponent(normalizedEmail)}` 
      };
    }

    // If no email confirmation is required
    revalidatePath('/', 'layout');
    return { success: true, redirectTo: returnTo };
  } catch (err) {
    console.error('Signup error:', err);
    const normalizedError = normalizeAuthError(err);
    return { error: { message: normalizedError.message } };
  }
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