'use client'

import { useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Captions from "yet-another-react-lightbox/plugins/captions"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/captions.css"

type ImageModalProps = {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
  description?: string
}

export function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  description 
}: ImageModalProps) {
  // Track zoom level for UI indicators if needed
  const [_currentZoom, _setCurrentZoom] = useState(1)

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={[{ 
        src: imageUrl, 
        alt: title || 'Image',
        title: title,
        description: description 
      }]}
      plugins={[Zoom, Captions]}
      
      // Enhanced zoom configuration
      zoom={{
        maxZoomPixelRatio: 8,        // Allow greater zoom
        scrollToZoom: true,          // Enable mouse wheel zoom
        // pinchToZoom: true,           // Enable touch pinch zoom - Commented out due to potential TS definition issue
        doubleClickMaxStops: 2,      // Double-click zooms in 2 levels max
        doubleClickDelay: 300,       // ms between clicks to count as double-click
        keyboardMoveDistance: 50,    // Pixel distance when using arrow keys
        wheelZoomDistanceFactor: 100, // Control zoom speed with wheel
        zoomInMultiplier: 2,         // How much to zoom in per step
        
        // Track zoom changes if needed - Commented out due to potential TS definition issue
        // onZoomChange: (zoom: number) => setCurrentZoom(zoom)
      }}
      
      // Clean up carousel controls since we only have one image
      carousel={{ finite: true }}
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
      
      // Additional options for a professional UX
      animation={{ swipe: 250 }}  // Faster animations
      controller={{ 
        closeOnBackdropClick: true,
        closeOnPullDown: true     // Mobile-friendly close gesture
      }}
      
      // Optional: className for styling the lightbox container
      className="image-modal-lightbox"
    />
  )
} 