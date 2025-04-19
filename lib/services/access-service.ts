import { createClient } from '@/utils/supabase/server';

/**
 * Checks if a user has access to a specific case.
 * Ideally, this involves checking a join table or similar.
 */
export async function checkCaseAccess(
  caseId: string,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false; // No access if not logged in

  const supabase = await createClient(); // Await the server client
  const { data: _data, error, count } = await supabase
    .from('user_case_access') // Assuming this is your access table
    .select('*' , { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('case_id', caseId);

  if (error) {
    // PGRST116 means no rows found, which is not an error here
    if (error.code !== 'PGRST116') { 
      console.error('Error checking case access:', error);
      // Decide how to handle errors - throw or return false?
      // Returning false denies access on error.
      return false; 
    }
    // If PGRST116, count will be 0 or null
  }

  // If count is greater than 0, the user has access
  return (count ?? 0) > 0;
} 