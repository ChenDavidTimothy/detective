'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export function useCaseAccess(caseId: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // The checkAccess function is now memoized so it can be called from outside
  const checkAccess = useCallback(async () => {
    if (!user?.id || !caseId) {
      setHasAccess(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('case_id', caseId)
        .maybeSingle(); // Use maybeSingle for better error handling

      if (error && error.code !== 'PGRST116') {  // PGRST116 is "not found"
        throw error;
      }

      setHasAccess(!!data);
    } catch (err) {
      console.error('Error checking case access:', err);
      setError('Failed to verify access to this case');
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, caseId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Expose the refresh function
  return { hasAccess, isLoading, error, refresh: checkAccess };
}