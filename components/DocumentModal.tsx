'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// IMPORTANT: Set the worker source to your local public directory
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  title?: string;
}

export function DocumentModal({ isOpen, onClose, documentUrl, title }: DocumentModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null); // Clear any previous errors
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(err);
    setIsLoading(false);
  };

  const handleDownloadFallback = () => {
    // Create a temporary anchor and trigger download
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = title || 'document.pdf';
    link.target = '_blank';
    link.click();
  };

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl border-none bg-background shadow-xs p-0">
        <DialogTitle className="sr-only">{title || 'Document'}</DialogTitle>
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
          
          {/* Document container */}
          <div className="bg-background rounded-xl overflow-hidden shadow-xs">
            {/* Header with title if provided */}
            {title && (
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">{title}</h3>
              </div>
            )}
            
            {/* PDF document */}
            <div className="relative flex justify-center p-4 min-h-[60vh] bg-muted">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="text-destructive text-center mb-4">
                    <p className="font-medium">Failed to load document</p>
                    <p className="text-sm">{error.message}</p>
                  </div>
                  <Button onClick={handleDownloadFallback} variant="outline" size="sm">
                    Download PDF Instead
                  </Button>
                </div>
              )}
              
              {!isLoading && !error && (
                <Document
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="flex justify-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    className="shadow-xs"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="sr-only">Previous page</span>
                </Button>
                
                <span className="text-sm">
                  Page {pageNumber} of {numPages || '?'}
                </span>
                
                <Button
                  onClick={goToNextPage}
                  disabled={pageNumber >= (numPages || 1)}
                  variant="ghost"
                  size="sm"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={zoomOut} variant="ghost" size="sm">
                  <ZoomOut className="w-5 h-5" />
                  <span className="sr-only">Zoom out</span>
                </Button>
                
                <span className="text-sm w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <Button onClick={zoomIn} variant="ghost" size="sm">
                  <ZoomIn className="w-5 h-5" />
                  <span className="sr-only">Zoom in</span>
                </Button>
                
                <Button onClick={rotate} variant="ghost" size="sm">
                  <RotateCw className="w-5 h-5" />
                  <span className="sr-only">Rotate</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 