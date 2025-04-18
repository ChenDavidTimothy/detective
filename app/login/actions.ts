// app/login/actions.ts
'use server'

import { parseAuthError } from '@/utils/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/supabase-admin'
import { revalidatePath } from 'next/cache'

interface AuthResult {
  success: boolean;
  redirectTo?: string;
  error?: {
    type: string;
    message: string;
  };
}

// Simplified email check function
async function checkEmailExists(email: string): Promise<{exists: boolean; provider?: string}> {
  const supabaseAdmin = createAdminClient();
  
  try {
    // Check auth.users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!error && data?.users) {
      const user = data.users.find(u => 
        u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (user) {
        return {
          exists: true,
          provider: user.app_metadata?.provider || 'email'
        };
      }
    }
    
    // Fallback to public.users
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);
      
    return {
      exists: !!userData?.length,
      provider: userData?.length ? 'unknown' : undefined
    };
  } catch (error) {
    console.error("Error checking email:", error);
    return { exists: false };
  }
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard';
  
  try {
    // First check if the email exists and its provider
    const { exists, provider } = await checkEmailExists(email);
    
    if (!exists) {
      return {
        success: false,
        error: {
          type: 'invalid-credentials',
          message: 'No account found with this email. Please sign up instead.'
        }
      };
    }
    
    if (provider === 'google') {
      return {
        success: false,
        error: {
          type: 'google-account',
          message: 'This email is associated with a Google account. Please sign in with Google instead.'
        }
      };
    }
    
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return {
        success: false,
        error: parseAuthError(error)
      };
    }
    
    // Check if email is verified
    if (!data.user?.email_confirmed_at) {
      return {
        success: false,
        error: {
          type: 'email-not-verified',
          message: 'Please verify your email before signing in.'
        }
      };
    }
    
    revalidatePath('/', 'layout');
    return { 
      success: true,
      redirectTo: returnTo
    };
  } catch (error) {
    return {
      success: false,
      error: parseAuthError(error)
    };
  }
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard';
  
  try {
    // Check if email exists
    const { exists, provider } = await checkEmailExists(email);
    
    if (exists) {
      const message = provider === 'google'
        ? 'This email is associated with a Google account. Please sign in with Google instead.'
        : 'This email is already registered. Please sign in instead.';
        
      return {
        success: false,
        error: {
          type: provider === 'google' ? 'google-account' : 'email-already-exists',
          message
        }
      };
    }
    
    // Basic password validation
    if (!password || password.length < 6) {
      return {
        success: false,
        error: {
          type: 'weak-password',
          message: 'Password must be at least 6 characters long.'
        }
      };
    }
    
    // Attempt signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(returnTo)}`
      }
    });
    
    if (error) {
      return {
        success: false,
        error: parseAuthError(error)
      };
    }
    
    // Check if email verification is required
    if (data.user && !data.user.email_confirmed_at) {
      return {
        success: true,
        redirectTo: `/verify-email?email=${encodeURIComponent(email)}`
      };
    }
    
    revalidatePath('/', 'layout');
    return { 
      success: true,
      redirectTo: returnTo
    };
  } catch (error) {
    return {
      success: false,
      error: parseAuthError(error)
    };
  }
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  
  if (!email) {
    return {
      success: false,
      error: {
        type: 'invalid-email',
        message: 'Email is required.'
      }
    };
  }
  
  try {
    // Check if email exists first to give better feedback
    const { exists, provider } = await checkEmailExists(email);
    
    if (!exists) {
      return {
        success: false,
        error: {
          type: 'invalid-email',
          message: 'No account found with this email.'
        }
      };
    }
    
    if (provider === 'google') {
      return {
        success: false,
        error: {
          type: 'google-account',
          message: 'This email is associated with a Google account. Please sign in with Google instead.'
        }
      };
    }
    
    // Send reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`
    });
    
    if (error) {
      return {
        success: false,
        error: parseAuthError(error)
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: parseAuthError(error)
    };
  }
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  // Validate password
  if (!password) {
    return {
      success: false,
      error: {
        type: 'weak-password',
        message: 'Password is required.'
      }
    };
  }
  
  if (password.length < 6) {
    return {
      success: false,
      error: {
        type: 'weak-password',
        message: 'Password must be at least 6 characters long.'
      }
    };
  }
  
  // Check if passwords match when confirmPassword is provided
  if (confirmPassword && password !== confirmPassword) {
    return {
      success: false,
      error: {
        type: 'password-mismatch',
        message: 'Passwords do not match.'
      }
    };
  }
  
  try {
    // Verify user session
    const { data, error: userError } = await supabase.auth.getUser();
    
    if (userError || !data?.user) {
      return {
        success: false,
        error: {
          type: 'expired-token',
          message: 'Your session has expired. Please try the password reset link again.'
        }
      };
    }
    
    // Update the password
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      return {
        success: false,
        error: parseAuthError(error)
      };
    }
    
    revalidatePath('/', 'layout');
    return { 
      success: true,
      redirectTo: '/dashboard'
    };
  } catch (error) {
    return {
      success: false,
      error: parseAuthError(error)
    };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: {
        type: 'unknown',
        message: 'Failed to sign out. Please try again.'
      }
    };
  }
}