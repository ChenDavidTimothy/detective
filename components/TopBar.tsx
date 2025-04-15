'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { BuyMeCoffee } from './BuyMeCoffee';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TopBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { isInTrial } = useTrialStatus();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      setIsLoggingOut(false);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="text-md sm:text-lg font-medium flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🎬</span>
          <span className="font-sans">NextTemp</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <ThemeToggle />
          
          {!user ? (
            <>
              <BuyMeCoffee />
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          ) : (
            <>
              {!isLoadingSubscription && (!isInTrial) && (
                !subscription || 
                subscription.status === 'canceled' || 
                (subscription.cancel_at_period_end && new Date(subscription.current_period_end) > new Date())
              ) && (
                <Button 
                  onClick={() => router.push('/profile')}
                  variant="default"
                  size="sm"
                  className="hidden sm:flex"
                >
                  View Subscription
                </Button>
              )}
              <BuyMeCoffee />

              {!isLoadingSubscription && (
                subscription || isInTrial
              ) && pathname !== '/dashboard' && (
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="default"
                  size="sm"
                  className="hidden sm:flex"
                >
                  {isInTrial ? "Start Free Trial" : "Start Building"}
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 w-10 h-10">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Profile & Subscription
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