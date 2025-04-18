'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { OnboardingTour } from '@/components/OnboardingTour';
import { User } from '@supabase/supabase-js';

interface ProtectedContentWrapperProps {
  children: React.ReactNode;
  user: User | null; // Pass the user object from the server layout
}

export default function ProtectedContentWrapper({ children, user }: ProtectedContentWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return; // Should ideally not happen if layout correctly redirects
      }

      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = 'No rows found'
          console.error('Failed to fetch onboarding status:', error);
          // Optionally handle error (e.g., show a message, don't show tour)
        } else if (!data || !data.has_completed_onboarding) {
          // Show onboarding if no record exists OR if it exists and is false
          setShowOnboarding(true);
        }
      } catch (e) {
        console.error('Error checking onboarding status:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]); // Re-run if user changes

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // The OnboardingTour component itself handles updating the DB
  };

  // Optional: Show a loading indicator while checking status
  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <>
      {children}
      {!isLoading && showOnboarding && user && (
        <OnboardingTour
          isFirstTime={showOnboarding} // Pass the state directly
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
} 