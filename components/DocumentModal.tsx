'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Try the CDN version instead of local file
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // Debug the URL when component mounts
  useEffect(() => {
    if (!isOpen || !documentUrl) { // Add check for documentUrl existence
      setDebugInfo('Waiting for document URL...');
      return;
    }

    console.log("DocumentModal debugging - URL:", documentUrl);
    setDebugInfo('Testing URL...');
    setIsLoading(true); // Ensure loading state is true when starting a new test
    setError(null); // Clear previous errors

    // Test if the URL is accessible
    fetch(documentUrl)
      .then(response => {
        console.log('PDF URL test - Status:', response.status, response.statusText);
        setDebugInfo(`URL status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          // Try to get more error details if possible
          return response.text().then(text => {
            console.error('PDF URL test failed response body:', text);
            throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);
          });
        }
        return response.blob();
      })
      .then(blob => {
        console.log('PDF blob received, size:', blob.size, 'type:', blob.type);
        setDebugInfo(`URL test successful: ${blob.size} bytes, type: ${blob.type}. Loading PDF...`);
        // Don't set isLoading to false here, let react-pdf handle it
      })
      .catch(error => {
        console.error('PDF URL test failed:', error);
        setDebugInfo(`URL test failed: ${error.message}`);
        setError(new Error(`Failed to fetch document: ${error.message}`)); // Set error state
        setIsLoading(false); // Stop loading if fetch fails
      });
  }, [isOpen, documentUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
    setScale(1); // Reset scale
    setRotation(0); // Reset rotation
    setIsLoading(false);
    setError(null);
    setDebugInfo(`PDF loaded: ${numPages} pages`);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF document:', err, 'URL:', documentUrl);
    // Check for common worker errors
    let errorMessage = err.message;
    if (err.name === 'WorkerException' || err.message.includes('worker')) {
      errorMessage = 'PDF worker failed to load or process the document. Check worker configuration and network tab.';
    } else if (err.message.includes('Missing PDF')) {
       errorMessage = 'Missing PDF file or invalid PDF structure.';
    } else if (err.message.includes('PasswordException')) {
        errorMessage = 'PDF is password protected.';
    }
    setError(new Error(errorMessage)); // Use the parsed error message
    setIsLoading(false);
    setNumPages(null); // Reset numPages on error
    setDebugInfo(`PDF load error: ${errorMessage}`);
  };

  const goToPrevPage = () => setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  const goToNextPage = () => setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages!));
  const zoomIn = () => setScale(prevScale => prevScale + 0.1);
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  const rotate = () => setRotation(prevRotation => (prevRotation + 90) % 360);

  // Reset state when modal closes or document changes
  useEffect(() => {
    if (!isOpen) {
      setNumPages(null);
      setPageNumber(1);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      setError(null);
      setDebugInfo('Initializing...');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[95vh] border-none bg-background shadow-xs p-0 flex flex-col">
        <DialogTitle className="sr-only">{title || 'Document'}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center space-x-4">
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {numPages !== null && !isLoading && !error && (
              <span className="text-sm text-muted-foreground">
                Page {pageNumber} of {numPages}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Controls */}
            {!isLoading && !error && numPages !== null && (
              <>
                <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages!}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={rotate}>
                  <RotateCw className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Debug info - remove in production */}
        <div className="p-2 bg-amber-100 text-amber-900 text-xs border-b shrink-0">
          <strong>Debug:</strong> {debugInfo}
        </div>

        {/* PDF document container */}
        <div className="relative flex-grow flex justify-center items-center p-4 bg-muted overflow-auto">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-3 mt-2">Loading PDF...</span>
              <span className="text-xs text-muted-foreground mt-1">Checking URL and initializing viewer...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-destructive mb-4">
                <p className="font-medium">Failed to load document</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => window.open(documentUrl, '_blank')} variant="outline" size="sm">
                  Open PDF in New Tab
                </Button>
                <Button onClick={() => {
                  console.log("Retrying PDF load...");
                  setIsLoading(true);
                  setError(null);
                  setDebugInfo('Retrying PDF load...');
                  // Re-trigger the fetch effect by slightly changing the URL (if possible) or just resetting state
                  // For simplicity, we rely on the useEffect re-running due to state changes
                  // Ensure worker is set correctly before retry
                  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
                  // Re-trigger the fetch and load process
                  // The useEffect hook listening to [isOpen, documentUrl] will re-run if documentUrl changes.
                  // If it doesn't change, we manually trigger parts of it or rely on component remount logic if applicable.
                  // Let's explicitly re-run the fetch logic here for clarity
                  fetch(documentUrl)
                    .then(response => {
                      setDebugInfo(`Retry URL status: ${response.status} ${response.statusText}`);
                      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                      return response.blob();
                    })
                    .then(blob => {
                      setDebugInfo(`Retry URL test successful: ${blob.size} bytes. Reloading document...`);
                      // Now let the Document component try loading again
                      // We might need to force a re-render or change a prop for Document to retry
                      // Setting numPages to null might help trigger a reload attempt internally if react-pdf handles it
                      setNumPages(null);
                    })
                    .catch(err => {
                       console.error('Retry PDF URL test failed:', err);
                       setDebugInfo(`Retry URL test failed: ${err.message}`);
                       setError(new Error(`Failed to fetch document on retry: ${err.message}`));
                       setIsLoading(false);
                    });

                }} variant="outline" size="sm">
                  Retry Loading
                </Button>
              </div>
               <p className="text-xs text-muted-foreground mt-4">If retrying fails, check console for errors or try opening in a new tab.</p>
            </div>
          )}

          {!isLoading && !error && documentUrl && (
            <Document
              file={documentUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null} // We handle loading state externally
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                // Try adding standardFontDataUrl if CMap issues persist with specific fonts
                // standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
              }}
              className="flex justify-center"
              key={documentUrl} // Add key prop to force remount when URL changes, ensuring reload
            >
              {numPages !== null && (
                <Page
                  key={`${documentUrl}-page-${pageNumber}`} // Also key the page for rotation/scale updates
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className="shadow-lg" // Slightly more shadow
                  renderTextLayer={false} // Keep disabled for initial testing
                  renderAnnotationLayer={false} // Keep disabled for initial testing
                  // Add error boundary for page rendering issues
                  onRenderError={(err) => {
                    console.error('Error rendering PDF page:', err);
                    setDebugInfo(`Error rendering page ${pageNumber}: ${err.message}`);
                    // Potentially show a page-specific error message
                  }}
                />
              )}
            </Document>
          )}
           {!documentUrl && !isLoading && (
             <div className="text-muted-foreground">No document URL provided.</div>
           )}
        </div>

      </DialogContent>
    </Dialog>
  );
} 