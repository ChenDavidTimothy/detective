'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { normalizeAuthError, type NormalizedAuthError } from '@/utils/auth-helpers';
import { 
  Session, 
  User, 
  SupabaseClient
} from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ 
    data: { user: User | null } | null; 
    error: NormalizedAuthError | null;
  }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<{ exists: boolean; provider?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log("AuthContext - mounted useEffect:", mounted);
    
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("AuthContext - Starting Try in InitializeAuth!");

        // First, get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !mounted) {
          setIsLoading(false);
          return;
        }

        // Update initial state
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Then set up listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (!mounted) return;
            
            const newUser = newSession?.user ?? null;
            setSession(newSession);
            setUser(newUser);
          }
        );

        // Only set loading to false after everything is initialized
        if (mounted) setIsLoading(false);
        
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check if an email already exists
  const checkEmailExists = async (email: string) => {
    try {
      // Use our API endpoint for accurate provider information
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check email');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking email existence:', error);
      // Fallback method if API call fails
      try {
        // Use the signIn method with an invalid password to check if user exists
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'check_email_exists_dummy_password'
        });
        
        if (error) {
          const errorMsg = error.message.toLowerCase();
          
          if (errorMsg.includes('invalid login credentials')) {
            // User exists but password is wrong (expected)
            return { exists: true, provider: 'email' }; // Default to email
          }
          
          if (errorMsg.includes('user already exists') ||
              errorMsg.includes('already registered')) {
            return { exists: true, provider: 'email' };
          }
        }
        
        // If we get here, user doesn't exist
        return { exists: false };
      } catch (error) {
        console.error('Error in fallback email check:', error);
        // If error, assume user doesn't exist to allow signup attempt
        return { exists: false };
      }
    }
  };

  const value = {
    user,
    session,
    isLoading,
    supabase,
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) throw authError;

        // Check if user was previously soft-deleted
        const { data: profile } = await supabase
          .from('users')
          .select('is_deleted, deleted_at')
          .eq('id', authData.user?.id)
          .single();

        if (profile?.is_deleted) {
          // Reactivate the account
          await supabase
            .from('users')
            .update({ 
              is_deleted: false, 
              deleted_at: null,
              reactivated_at: new Date().toISOString() 
            })
            .eq('id', authData.user?.id);
        }

        return authData;
      } catch (error) {
        // Normalize auth errors
        const normalizedError = normalizeAuthError(error);
        throw normalizedError;
      }
    },
    signOut: async () => {
      try {
        // First cleanup all active connections/states
        window.dispatchEvent(new Event('cleanup-before-logout'));
        
        // Wait a small amount of time for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then perform the actual signout
        await supabase.auth.signOut();
        
        // Force redirect to login
        window.location.assign('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      try {
        // First, check if the email already exists
        const { exists, provider } = await checkEmailExists(email);
        
        if (exists) {
          // Return a normalized error about the existing account
          return { 
            data: null, 
            error: {
              type: 'email-already-exists',
              message: provider === 'google' 
                ? "This email is already used with Google Sign In. Please use Google to sign in."
                : "This email is already registered. Please sign in instead.",
            }
          };
        }
        
        // If email doesn't exist, proceed with signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        return { 
          data: null, 
          error: normalizeAuthError(error)
        };
      }
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });
      if (error) throw error;
    },
    checkEmailExists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);