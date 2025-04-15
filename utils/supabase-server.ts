import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  // Get stored token if exists
  const authToken = cookieStore.get('supabase-auth-token')?.value;
  
  // Create client with or without initial auth state
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        ...(authToken && {
          initialSession: {
            access_token: authToken,
            refresh_token: '',
            expires_in: 3600,
            expires_at: 0,
            token_type: 'bearer',
          }
        })
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    }
  );
}
