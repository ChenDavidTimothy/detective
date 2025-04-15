'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { normalizeAuthError, type NormalizedAuthError } from '@/utils/auth-helpers';
import { Session, User, SupabaseClient } from '@supabase/supabase-js';

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
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !mounted) {
          setIsLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (!mounted) return;
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        );
        if (mounted) setIsLoading(false);
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        if (mounted) setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Check if an email already exists and return provider
  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Failed to check email');
      return await response.json();
    } catch (error) {
      return { exists: false };
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
        return authData;
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    signOut: async () => {
      try {
        window.dispatchEvent(new Event('cleanup-before-logout'));
        await new Promise(resolve => setTimeout(resolve, 100));
        await supabase.auth.signOut();
        window.location.assign('/login');
      } catch (error) {}
    },
    signUpWithEmail: async (email: string, password: string) => {
      try {
        // Pre-check for existing email and provider
        const { exists, provider } = await value.checkEmailExists(email);
        if (exists) {
          if (provider === 'google') {
            return {
              data: null,
              error: {
                type: 'email-already-exists',
                message: "This email is already registered with Google. To use email/password, click 'Forgot password' to set a password for your account."
              }
            };
          } else {
            return {
              data: null,
              error: {
                type: 'email-already-exists',
                message: "This email is already registered. Please sign in instead."
              }
            };
          }
        }

        // Proceed with signup
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
