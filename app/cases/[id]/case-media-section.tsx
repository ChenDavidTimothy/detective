'use client';

import { useState } from 'react';
import { useCaseMedia } from '@/hooks/useCaseMedia';
import { VideoModal } from '@/components/VideoModal';
import { ImageModal } from '@/components/ImageModal';
import { DocumentModal } from '@/components/DocumentModal';
import { AudioModal } from '@/components/AudioModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, Image, FileText, Video, Volume } from 'lucide-react';
import NextImage from 'next/image';
import { type CaseMedia } from '@/lib/types/case-media';

type MediaWithUrl = CaseMedia & { url?: string };

interface CaseMediaSectionProps {
  caseId: string;
  initialMedia: CaseMedia[];
  initialHasAccess: boolean;
}

export default function CaseMediaSection({ 
  caseId, 
  initialMedia,
  initialHasAccess
}: CaseMediaSectionProps) {
  const shouldFetch = initialHasAccess;
  
  const { media, isLoading, error } = useCaseMedia(
    shouldFetch ? caseId : '', 
    initialMedia
  );
  
  const [selectedMedia, setSelectedMedia] = useState<MediaWithUrl | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  
  const openMediaModal = (item: MediaWithUrl) => {
    setSelectedMedia(item);
    
    if (!item.url && !item.external_url) {
      console.warn("Attempted to open media without a valid URL:", item);
      return; 
    }

    switch (item.media_type) {
      case 'video':
        if (item.external_url) {
          setIsVideoModalOpen(true);
        } else {
          console.warn("Video media type missing external_url:", item);
        }
        break;
      case 'image':
        if (item.url) setIsImageModalOpen(true);
        break;
      case 'document':
        if (item.url) {
          console.log('Opening document modal with URL:', item.url);
          setIsDocumentModalOpen(true);
        }
        break;
      case 'audio':
        if (item.url) setIsAudioModalOpen(true);
        break;
    }
  };
  
  const closeAllModals = () => {
    setIsVideoModalOpen(false);
    setIsImageModalOpen(false);
    setIsDocumentModalOpen(false);
    setIsAudioModalOpen(false);
    setSelectedMedia(null);
  };
  
  if (!initialHasAccess) {
    return <div>You do not have access to view the media for this case.</div>;
  }

  if (isLoading) {
    return <div>Loading case media...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (media.length === 0 && initialMedia.length === 0) {
    return <div>No media available for this case.</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Evidence</CardTitle>
        <CardDescription>
          Review the evidence files for this investigation.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Evidence</TabsTrigger>
            {media.filter(item => item.media_type === 'image').length > 0 && <TabsTrigger value="images">Images</TabsTrigger>}
            {media.filter(item => item.media_type === 'document').length > 0 && <TabsTrigger value="documents">Documents</TabsTrigger>}
            {media.filter(item => item.media_type === 'audio').length > 0 && <TabsTrigger value="audio">Audio</TabsTrigger>}
            {media.filter(item => item.media_type === 'video').length > 0 && <TabsTrigger value="videos">Videos</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {media.map(item => (
                <MediaCard
                  key={item.id}
                  media={item}
                  onClick={() => openMediaModal(item)}
                />
              ))}
            </div>
          </TabsContent>
          
          {media.filter(item => item.media_type === 'image').length > 0 && (
            <TabsContent value="images">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.filter(item => item.media_type === 'image').map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => openMediaModal(item)} />
                ))}
              </div>
            </TabsContent>
          )}

          {media.filter(item => item.media_type === 'document').length > 0 && (
            <TabsContent value="documents">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.filter(item => item.media_type === 'document').map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => openMediaModal(item)} />
                ))}
              </div>
            </TabsContent>
          )}

          {media.filter(item => item.media_type === 'audio').length > 0 && (
            <TabsContent value="audio">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.filter(item => item.media_type === 'audio').map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => openMediaModal(item)} />
                ))}
              </div>
            </TabsContent>
          )}

          {media.filter(item => item.media_type === 'video').length > 0 && (
            <TabsContent value="videos">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.filter(item => item.media_type === 'video').map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => openMediaModal(item)} />
                ))}
              </div>
            </TabsContent>
          )}
          
        </Tabs>
      </CardContent>
      
      {selectedMedia && (
        <>
          {selectedMedia.media_type === 'video' && selectedMedia.external_url && (
            <VideoModal
              isOpen={isVideoModalOpen}
              onClose={closeAllModals}
              videoId={selectedMedia.external_url}
              title={selectedMedia.title}
              description={selectedMedia.description}
            />
          )}
          
          {selectedMedia.media_type === 'image' && selectedMedia.url && (
            <ImageModal
              isOpen={isImageModalOpen}
              onClose={closeAllModals}
              imageUrl={selectedMedia.url}
              title={selectedMedia.title}
              description={selectedMedia.description}
            />
          )}
          
          {selectedMedia.media_type === 'document' && selectedMedia.url && (
            <DocumentModal
              isOpen={isDocumentModalOpen}
              onClose={closeAllModals}
              documentUrl={selectedMedia.url}
              title={selectedMedia.title}
            />
          )}
          
          {selectedMedia.media_type === 'audio' && selectedMedia.url && (
            <AudioModal
              isOpen={isAudioModalOpen}
              onClose={closeAllModals}
              audioUrl={selectedMedia.url}
              title={selectedMedia.title}
              coverImage={selectedMedia.cover_image_url}
            />
          )}
        </>
      )}
    </Card>
  );
}

function MediaCard({ media, onClick }: { media: MediaWithUrl; onClick: () => void }) {
  const getIcon = () => {
    switch (media.media_type) {
      case 'image':
        // eslint-disable-next-line jsx-a11y/alt-text -- Icon is decorative
        return <Image className="w-8 h-8 text-primary" />;
      case 'document':
        return <FileText className="w-8 h-8 text-primary" />;
      case 'audio':
        return <Volume className="w-8 h-8 text-primary" />;
      case 'video':
        return <Video className="w-8 h-8 text-primary" />;
      default:
        return <File className="w-8 h-8 text-primary" />;
    }
  };
  
  const getPreview = () => {
    if (media.media_type === 'image' && media.url) {
      return (
        <div className="relative w-full h-32 rounded-t-md overflow-hidden">
          <NextImage
            src={media.url}
            alt={media.title || 'Case image preview'}
            layout="fill"
            objectFit="cover"
          />
        </div>
      );
    }
    
    return (
      <div className="w-full h-32 bg-muted flex items-center justify-center">
        {getIcon()}
      </div>
    );
  };
  
  return (
    <div
      className="flex flex-col border rounded-md overflow-hidden hover:shadow-xs transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {getPreview()}
      <div className="p-3">
        <h3 className="font-medium truncate">{media.title}</h3>
        {media.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {media.description}
          </p>
        )}
      </div>
    </div>
  );
} 