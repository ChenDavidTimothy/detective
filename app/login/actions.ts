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

interface EmailCheckResult {
  exists: boolean;
  provider?: string;
  is_deleted?: boolean;
}

// Modified email check function
async function checkEmailExists(email: string): Promise<EmailCheckResult> {
  const supabaseAdmin = createAdminClient();
  
  try {
    // Check auth.users first (primary source for provider)
    const { data: authUsersData, error: _authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsersData?.users.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      // If found in auth.users, check public.users for is_deleted status
      const { data: publicUserData, error: publicUserError } = await supabaseAdmin
        .from('users')
        .select('id, is_deleted')
        .eq('email', email.toLowerCase())
        .maybeSingle(); // Use maybeSingle() as the public user might not exist yet in rare cases

      if (publicUserError) {
        console.error("Error checking public.users:", publicUserError);
        // Fallback or specific error handling might be needed
        return { exists: true, provider: authUser.app_metadata?.provider || 'email', is_deleted: false }; // Default to not deleted if check fails? Or throw error?
      }

      return {
        exists: true,
        provider: authUser.app_metadata?.provider || 'email',
        is_deleted: publicUserData?.is_deleted ?? false // Use nullish coalescing
      };
    }

    // If not in auth.users, check public.users (e.g., if auth user was deleted but profile remained?)
    // This scenario might indicate inconsistent data, but we handle it just in case.
    const { data: publicUserDataOnly, error: publicUserOnlyError } = await supabaseAdmin
      .from('users')
      .select('id, is_deleted')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (publicUserOnlyError) {
      console.error("Error checking public.users (fallback):", publicUserOnlyError);
      return { exists: false }; // Assume doesn't exist if check fails
    }

    return {
      exists: !!publicUserDataOnly,
      provider: 'unknown', // Can't determine provider reliably from public.users alone
      is_deleted: publicUserDataOnly?.is_deleted ?? false
    };

  } catch (error) {
    console.error("Error checking email:", error);
    return { exists: false }; // Default to non-existent on error
  }
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const returnTo = (formData.get('returnTo') as string) ?? '/dashboard';
  
  try {
    // Check email status, including deletion
    const { exists, provider, is_deleted } = await checkEmailExists(email);
    
    if (!exists) {
      return {
        success: false,
        error: {
          type: 'invalid-credentials',
          message: 'No account found with this email. Please sign up instead.'
        }
      };
    }

    // Check if account is deleted
    if (is_deleted) {
      return {
        success: false,
        error: {
          type: 'account-deleted',
          message: 'This account has been deleted.'
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
      // We should still check for deletion *again* here, although unlikely to change mid-login
      // In case the user object returned doesn't reflect the is_deleted status directly
      const { is_deleted: isDeletedAfterLogin } = await checkEmailExists(email);
       if (isDeletedAfterLogin) {
         // Sign out immediately if somehow they logged in with a deleted account
         await supabase.auth.signOut();
         return {
           success: false,
           error: {
             type: 'account-deleted',
             message: 'This account has been deleted.'
           }
         };
       }

      return {
        success: false,
        error: {
          type: 'email-not-verified',
          message: 'Please verify your email before signing in.'
        }
      };
    }

    // Final deletion check after successful login before redirection
     const { is_deleted: isDeletedFinal } = await checkEmailExists(email);
     if (isDeletedFinal) {
       // Sign out immediately
       await supabase.auth.signOut();
       return {
         success: false,
         error: {
           type: 'account-deleted',
           message: 'This account has been deleted.'
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
    // Check email status, including deletion
    const { exists, provider, is_deleted } = await checkEmailExists(email);
    
    if (exists) {
      // If account exists and is deleted, prevent signup
      if (is_deleted) {
        return {
          success: false,
          error: {
            type: 'account-deleted',
            message: 'An account with this email has been deleted and cannot be re-registered.'
          }
        };
      }
      
      // If account exists and is not deleted, proceed with existing logic
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
    // Check email status, including deletion
    const { exists, provider, is_deleted } = await checkEmailExists(email);
    
    if (!exists) {
      return {
        success: false,
        error: {
          type: 'invalid-email',
          message: 'No account found with this email.'
        }
      };
    }

    // Prevent password reset for deleted accounts
    if (is_deleted) {
      return {
        success: false,
        error: {
          type: 'account-deleted',
          message: 'Password reset is not available for deleted accounts.'
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