import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

export function VideoModal({ isOpen, onClose, videoId }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl border-none bg-transparent shadow-none p-0">
        <div className="relative w-full">
          {/* Close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent"
          >
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </Button>
          
          {/* Video container with 16:9 aspect ratio */}
          <div className="relative pt-[56.25%] rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="absolute inset-0 w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}