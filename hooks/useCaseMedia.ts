import { useState, useEffect } from 'react';
import { getCaseMediaClient, getSignedUrl, type CaseMedia } from '@/lib/services/media-service-client';

export type MediaWithUrl = CaseMedia & { url?: string };

export function useCaseMedia(caseId: string, initialMedia: CaseMedia[] = []) {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(initialMedia.length === 0);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadMediaWithUrls() {
      setIsLoading(true); // Start loading
      setError(null);
      try {
        // Use initial media or fetch new data using client service
        const mediaData = initialMedia.length > 0 
          ? initialMedia 
          : await getCaseMediaClient(caseId);
        
        // Generate signed URLs for storage-based media
        const withUrls = await Promise.all(
          mediaData.map(async (item) => {
            if (item.storage_path && ['image', 'document', 'audio'].includes(item.media_type)) {
              const signedUrl = await getSignedUrl(item.storage_path);
              return { ...item, url: signedUrl || undefined };
            }
            // Also include external URLs directly
            if (item.external_url) {
              return { ...item, url: item.external_url };
            }
            return item;
          })
        );
        
        setMedia(withUrls);
      } catch (err) {
        console.error('Error loading case media:', err);
        setError('Failed to load media files');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMediaWithUrls();
  // Ensure initialMedia changes also trigger a reload if needed,
  // converting it to a stable value like JSON string for dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, JSON.stringify(initialMedia)]);
  
  return { media, isLoading, error };
} 