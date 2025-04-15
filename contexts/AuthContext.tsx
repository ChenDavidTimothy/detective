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
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data: { user: User | null } | null; error: NormalizedAuthError | null; }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<{ exists: boolean; provider?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkEmailExists(email: string) {
  try {
    const response = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to check email');
    return await response.json();
  } catch {
    return { exists: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setIsLoading(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    isLoading,
    supabase,
    signInWithGoogle: async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
    },
    signInWithEmail: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
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
      } catch (error) {
        console.error(error);
      }
    },
    signUpWithEmail: async (email, password) => {
      try {
        const { exists, provider } = await checkEmailExists(email);
        if (exists) {
          return {
            data: null,
            error: {
              type: 'email-already-exists',
              message: provider === 'google'
                ? "This email is already registered with Google. To use email/password, click 'Forgot password' to set a password for your account."
                : "This email is already registered. Please sign in instead."
            }
          };
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        return { data: null, error: normalizeAuthError(error) };
      }
    },
    updatePassword: async (newPassword) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    updateEmail: async (newEmail) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    resetPassword: async (email) => {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
