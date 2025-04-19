'use client'

import { Dialog, DialogContentWithoutClose, DialogTitle } from '@/components/ui/dialog';

type VideoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
  description?: string;
};

export function VideoModal({ isOpen, onClose, videoId, title, description }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentWithoutClose onClose={onClose} className="sm:max-w-4xl border-none bg-transparent shadow-none p-0">
        <DialogTitle className="sr-only">{title || 'Video'}</DialogTitle>
        <div className="relative w-full">
          <div className="relative pt-[56.25%] rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="absolute inset-0 w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          {(title || description) && (
            <div className="bg-background/90 p-4 rounded-b-xl mt-[-8px]">
              {title && <h3 className="text-lg font-medium text-primary-foreground">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
          )}
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  );
}
