'use client'

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContentWithoutClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
};

export function ImageModal({ isOpen, onClose, imageUrl, title, description }: ImageModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Handler to prevent modal from closing when clicking inside
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentWithoutClose 
        className="sm:max-w-4xl border-none bg-transparent shadow-none p-0"
        onClick={handleContentClick} // Add click handler here
      >
        <DialogTitle className="sr-only">{title || 'Image'}</DialogTitle>
        <div className="relative w-full">
          {/* Single close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent z-50"
          >
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </Button>
          
          <div className="bg-black rounded-xl overflow-hidden">
            <div 
              className="relative h-[80vh] cursor-zoom-in" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent closing
                setLightboxOpen(true); // Open lightbox
              }}
            >
              <Image 
                src={imageUrl} 
                alt={title || 'Image'} 
                layout="fill"
                objectFit="contain"
                className="w-full h-auto"
              />
              
              {/* Metadata overlay (if any) */}
              {(title || description) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 z-10">
                  {title && <h3 className="text-lg font-medium">{title}</h3>}
                  {description && <p className="text-sm opacity-80">{description}</p>}
                </div>
              )}
            </div>
            
            {/* Make sure lightbox doesn't close modal */}
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={[{ 
                src: imageUrl, 
                alt: title,
                title: title,
                description: description 
              }]}
              plugins={[Zoom, Captions]}
              zoom={{
                maxZoomPixelRatio: 5,
                scrollToZoom: true,
              }}
              carousel={{ finite: true }}
              render={{
                buttonPrev: () => null,
                buttonNext: () => null,
              }}
              controller={{ closeOnBackdropClick: true }}
            />
          </div>
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  );
} 