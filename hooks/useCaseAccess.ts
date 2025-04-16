// hooks/useCaseAccess.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useCaseAccess(caseId: string, initialHasAccess = false) {
  const [hasAccess, setHasAccess] = useState<boolean>(initialHasAccess);
  const [isLoading, setIsLoading] = useState<boolean>(!initialHasAccess);
  const [error, setError] = useState<string | null>(null);

  // Checks access for a given userId and caseId
  const checkAccess = useCallback(
    async (userId: string) => {
      if (!userId || !caseId) {
        setHasAccess(false);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id')
          .eq('user_id', userId)
          .eq('case_id', caseId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
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
    },
    [caseId]
  );

  // Fetch user and check access if needed
  useEffect(() => {
    let isMounted = true;

    const fetchUserAndAccess = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        const userId = data.user?.id;
        if (!userId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        if (!initialHasAccess) {
          await checkAccess(userId);
        } else {
          if (isMounted) setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserAndAccess();

    return () => {
      isMounted = false;
    };
  }, [caseId, initialHasAccess, checkAccess]);

  // Refresh access check
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (userId) {
        await checkAccess(userId);
      } else {
        setHasAccess(false);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      setIsLoading(false);
    }
  }, [checkAccess]);

  return { hasAccess, isLoading, error, refresh };
}
