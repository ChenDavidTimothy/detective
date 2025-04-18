'use client'

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OnboardingTourProps {
  isFirstTime: boolean;
  onComplete: () => void;
}

interface Step {
  title: string;
  description: React.ReactNode;
  targetClass: string;
}

export function OnboardingTour({ isFirstTime, onComplete }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo<Step[]>(() => [
    {
      title: "Welcome to Detective!",
      description: (
        "Ready to put your detective skills to the test? Let's take a quick look around."
      ),
      targetClass: "welcome-message"
    },
    {
      title: "Browse Available Cases",
      description: (
        "Here you can find all the unsolved mysteries waiting for you. Scroll through to see the different cases."
      ),
      targetClass: "case-list-container"
    },
    {
      title: "View Case Details",
      description: (
        "Click on any case card to see more details, like its description, difficulty, and price."
      ),
      targetClass: "case-card"
    },
    {
      title: "Purchase a Case",
      description: (
        "Found a case that intrigues you? Click the purchase button to unlock the full case file and start investigating."
      ),
      targetClass: "purchase-button"
    },
    {
      title: "Your Purchased Cases",
      description: (
        "After purchasing, your cases will appear here. This is your personal collection of mysteries to solve."
      ),
      targetClass: "my-cases-section"
    },
    {
      title: "Start Solving!",
      description: (
        "Select a purchased case and click 'Start Solving' to dive into the evidence and crack the case!"
      ),
      targetClass: "open-case-button"
    }
  ], []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      // Check if user has completed onboarding
      const { data, error } = await supabase
        .from('user_preferences')
        .select('has_completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch onboarding status:', error);
        return;
      }

      // Only show onboarding if it's first time and hasn't been completed
      if (isFirstTime && (!data || !data.has_completed_onboarding)) {
        setIsOpen(true);
      }
    };

    checkOnboardingStatus();
  }, [isFirstTime]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      highlightElement(steps[currentStep + 1].targetClass);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      highlightElement(steps[currentStep - 1].targetClass);
    }
  };

  const handleComplete = async () => {
    setIsOpen(false);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return;
    }

    // Upsert user preferences
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        has_completed_onboarding: true
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Failed to update onboarding status:', error);
    }
    
    onComplete();
  };

  // Keep track of highlighted element
  const highlightElement = (className: string) => {
    const element = document.querySelector(`.${className}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-primary', 'ring-opacity-50', 'transition-all', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-primary', 'ring-opacity-50');
      }, 2000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      highlightElement(steps[currentStep].targetClass);
    }
  }, [currentStep, isOpen, steps]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] min-h-[250px]">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="min-h-[120px] mt-4">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className={`${currentStep === 0 ? 'invisible' : ''}`}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
            <Button
              onClick={handleNext}
              variant="default"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
