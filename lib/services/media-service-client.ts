import { createClient } from '@/utils/supabase/client';
import type { CaseMedia } from '@/lib/types/case-media';

/**
 * Fetch all media for a specific case - CLIENT VERSION.
 */
export async function getCaseMediaClient(caseId: string): Promise<CaseMedia[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('case_media')
    .select('*')
    .eq('case_id', caseId)
    .order('display_order');

  if (error) {
    console.error('Error fetching case media:', error);
    throw new Error(`Failed to fetch media for case ${caseId}: ${error.message}`);
  }

  return data as CaseMedia[];
}

/**
 * Create a signed URL for a storage path.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .storage
    .from('case-media')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
} 