'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Button } from '@/components/ui/button'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

interface PDFViewerProps {
  documentUrl: string
}

export function PDFViewer({ documentUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [isDocumentLoading, setIsDocumentLoading] = useState(true); // Added loading state

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1) // Reset to first page on new document load
    setScale(1.0) // Reset scale
    setRotation(0) // Reset rotation
    setLoadError(null)
    setIsDocumentLoading(false); // Set loading to false
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Failed to load PDF:', error)
    setLoadError(error)
    setNumPages(null)
    setIsDocumentLoading(false); // Set loading to false even on error
  }, [])

  // Wrap navigation functions in useCallback
  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  }, [numPages]);

  // Wrap zoom functions in useCallback (optional but good practice)
  const zoomIn = useCallback(() => setScale((prev) => Math.min(prev + 0.2, 3.0)), []);
  const zoomOut = useCallback(() => setScale((prev) => Math.max(prev - 0.2, 0.5)), []);

  // Wrap rotation functions in useCallback (optional but good practice)
  const rotateLeft = useCallback(() => setRotation((prev) => (prev - 90) % 360), []);
  const rotateRight = useCallback(() => setRotation((prev) => (prev + 90) % 360), []);

  // Update dependencies for keydown effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!numPages) return
      switch (event.key) {
        case 'ArrowLeft':
          goToPrevPage()
          break
        case 'ArrowRight':
          goToNextPage()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [numPages, goToPrevPage, goToNextPage])

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <p>Error loading PDF:</p>
        <p>{loadError.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center h-full w-full bg-muted">
      {/* Controls UI - Show only when document is loaded */} 
      {numPages && !isDocumentLoading && (
        <div className="flex items-center justify-center gap-2 p-1 sm:p-2 bg-card rounded-full mb-2 sm:mb-4 shadow-xs z-10 sticky top-2 flex-wrap max-w-[95%] mx-auto">
          {/* Page Navigation */}
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium whitespace-nowrap">
            Page {pageNumber} of {numPages}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= (numPages || 0)}>
            <ChevronRight className="h-5 w-5" />
          </Button>

          <span className="border-l h-6 mx-2"></span>

          {/* Zoom Controls */}
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium min-w-[40px] text-center">{(scale * 100).toFixed(0)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3.0}>
            <ZoomIn className="h-5 w-5" />
          </Button>

          <span className="border-l h-6 mx-2"></span>

          {/* Rotation Controls */}
          <Button variant="ghost" size="icon" onClick={rotateLeft}>
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={rotateRight}>
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Document container with improved overflow handling */}
      <div className="w-full flex-grow overflow-auto relative max-h-[60vh] sm:max-h-none">
        {isDocumentLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium">Loading document...</p>
          </div>
        )}
        
        <Document
          file={documentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={pdfOptions}
          externalLinkTarget="_blank"
          loading={null} // Prevent default loading indicator
          className={isDocumentLoading ? 'opacity-0' : 'min-h-full flex p-4'}
        >
          {numPages && (
            <Page
              key={`${pageNumber}-${scale}-${rotation}`}
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-md mx-auto"
            />
          )}
        </Document>
      </div>
    </div>
  )
}
