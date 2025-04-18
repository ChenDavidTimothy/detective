'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { OnboardingTour } from '@/components/OnboardingTour';
import { User } from '@supabase/supabase-js';

const supabase = createClient();

interface ProtectedContentWrapperProps {
  children: React.ReactNode;
  user: User | null;
}

export default function ProtectedContentWrapper({
  children,
  user,
}: ProtectedContentWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // pull out the id so TS knows it's not null inside fetch()
    const userId = user.id;

    async function fetchOnboardingStatus() {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to fetch onboarding status:', error);
        } else if (!data?.has_completed_onboarding) {
          setShouldShowTour(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = () => {
    setShouldShowTour(false);
  };

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {shouldShowTour && (
        <OnboardingTour isFirstTime={true} onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
