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
    const headersList = await headers();

    // Try to get the current path from known headers
    const rawPath =
      headersList.get('x-pathname') ||
      headersList.get('x-url') ||
      headersList.get('referer') ||
      '';

    // If it's a full URL, extract just the path
    const currentPath = rawPath.includes('://')
      ? new URL(rawPath).pathname
      : rawPath;

    const returnTo = encodeURIComponent(currentPath);
    redirect(`/login?returnTo=${returnTo}`);
  }

  return children;
}
