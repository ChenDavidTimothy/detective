// Create file: /hooks/useCaseAccess.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export function useCaseAccess(caseId: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (!user?.id || !caseId) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('case_id', caseId)
          .single();

        if (error && error.code !== 'PGRST116') {  // PGRST116 is "not found" error
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
    }

    checkAccess();
  }, [user?.id, caseId]);

  return { hasAccess, isLoading, error };
}