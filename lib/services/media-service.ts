// lib/services/media-service.ts - Keep this for server components only
import { createClient } from '@/utils/supabase/server'; // Only server client
import { createStaticClient } from '@/utils/supabase/static-client';

export interface CaseMedia { // Keep the interface if used elsewhere, or move it
  id: string;
  case_id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'document' | 'audio' | 'video';
  storage_path?: string;
  external_url?: string;
  cover_image_url?: string;
  display_order: number;
}

type ServiceOptions = { isStatic?: boolean };

/**
 * Returns the proper Supabase client for static or runtime calls.
 */
async function getClient(isStatic = false) {
  return isStatic ? createStaticClient() : await createClient(); // Uses server client
}

/**
 * SERVER ONLY: Fetch all media for a specific case.
 */
export async function getCaseMedia(
  caseId: string,
  { isStatic = false }: ServiceOptions = {}
): Promise<CaseMedia[]> {
  const supabase = await getClient(isStatic);
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

// Removed getSignedUrl function as it belongs to the client service 