// app/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Access Supabase client for auth check
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    // Get current path to redirect back after login
    // Headers must be awaited in Next.js 14
    const headersList = await headers();
    
    // Safely access header values
    let currentPath = '';
    try {
      currentPath = headersList.get('x-pathname') || 
                    headersList.get('x-url') || 
                    headersList.get('referer') || 
                    '';
                    
      // If it's a full URL, extract just the path
      if (currentPath.includes('://')) {
        const url = new URL(currentPath);
        currentPath = url.pathname;
      }
    } catch (e) {
      console.error('Error accessing headers:', e);
      // Fallback to empty path
      currentPath = '';
    }
    
    const returnTo = encodeURIComponent(currentPath);
    redirect(`/login?returnTo=${returnTo}`);
  }

  return <>{children}</>;
}