// hooks/useCaseAccess.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useCaseAccess(caseId: string, initialHasAccess = false) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(initialHasAccess);
  const [isLoading, setIsLoading] = useState<boolean>(!initialHasAccess);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndAccess = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        
        if (!data.user?.id) {
          setIsLoading(false);
          return;
        }
        
        setUserId(data.user.id);
        
        if (!initialHasAccess) {
          await checkAccess(data.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setIsLoading(false);
      }
    };
    
    fetchUserAndAccess();
  }, [caseId, initialHasAccess]);

  const checkAccess = useCallback(async (currentUserId: string) => {
    if (!currentUserId || !caseId) {
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
        .eq('user_id', currentUserId)
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
  }, [caseId]);

  const refresh = useCallback(() => {
    if (userId) {
      checkAccess(userId);
    }
  }, [userId, checkAccess]);

  return { hasAccess, isLoading, error, refresh };
}