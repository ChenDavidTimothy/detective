'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import "yet-another-react-lightbox/styles.css";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, title, description }: ImageModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl border-none bg-transparent shadow-none p-0">
        <DialogTitle className="sr-only">{title || 'Image'}</DialogTitle>
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
          
          {/* Image container */}
          <div className="bg-black rounded-xl overflow-hidden">
            <div className="relative h-[80vh] cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
              <Image 
                src={imageUrl} 
                alt={title || 'Image'} 
                layout="fill"
                objectFit="contain"
                className="w-full h-auto"
              />
              
              {(title || description) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 z-10">
                  {title && <h3 className="text-lg font-medium">{title}</h3>}
                  {description && <p className="text-sm opacity-80">{description}</p>}
                </div>
              )}
            </div>
            
            {/* Lightbox for zooming */}
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={[{ src: imageUrl, alt: title }]}
              plugins={[Zoom]}
              render={{ buttonPrev: () => null, buttonNext: () => null }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 