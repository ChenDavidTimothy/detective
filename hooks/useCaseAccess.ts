// hooks/useCaseAccess.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { tryCatch, Result, isSuccess } from '@/utils/result';

interface CaseAccess {
  id: string;
  user_id: string;
}

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

      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from('user_purchases')
        .select('id, user_id')
        .eq('user_id', userId)
        .eq('case_id', caseId)
        .maybeSingle();

      let result: Result<boolean>;
      if (queryError && queryError.code !== 'PGRST116') {
        console.error('Supabase query error in checkAccess:', queryError);
        result = { data: null, error: queryError };
      } else {
        result = { data: !!data, error: null };
      }

      if (isSuccess(result)) {
        setHasAccess(result.data);
      } else {
        console.error('Error checking case access:', result.error);
        setError('Failed to verify access to this case');
        setHasAccess(false);
      }
      setIsLoading(false);
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
