// components/TopBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/login/actions';

export default function TopBar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };

    fetchUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        window.location.href = '/login';
      } else {
        throw new Error('Failed to sign out');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <Link
          href="/"
          className="text-md sm:text-lg font-medium flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🔍</span>
          <span className="font-sans">Detective Cases</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Button asChild variant="ghost" size="sm">
            <Link href="/cases">Browse Cases</Link>
          </Button>

          {isLoading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          ) : !user ? (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : (
            <>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="default"
                size="sm"
                className="hidden sm:flex"
              >
                My Cases
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full p-0 w-10 h-10"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="destructive"
                  >
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}