'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertCircle,
} from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// PDF.js worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// These options never change, so no need for useMemo
const pdfOptions = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

interface PDFViewerProps {
  documentUrl: string
}

export function PDFViewer({ documentUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setNumPages(null)
    setPageNumber(1)
    setScale(1)
    setRotation(0)
    setIsLoading(true)
    setError(null)
  }, [documentUrl])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setIsLoading(false)
  }

  const onDocumentLoadError = (err: Error) => {
    let msg = err.message
    if (msg.includes('worker')) {
      msg = 'PDF worker failed to load. Check your connection.'
    } else if (msg.match(/Missing PDF|Invalid PDF/)) {
      msg = 'The document is corrupted or invalid.'
    } else if (msg.includes('PasswordException')) {
      msg = 'PDF is password protected.'
    } else if (msg.includes('CORS')) {
      msg = 'Access to this document is restricted by CORS.'
    }
    setError(new Error(msg))
    setIsLoading(false)
    setNumPages(null)
  }

  const goPrev = () => setPageNumber((p) => Math.max(p - 1, 1))
  const goNext = () =>
    setPageNumber((p) => (numPages ? Math.min(p + 1, numPages) : p))
  const zoomIn = () => setScale((s) => s + 0.1)
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5))
  const rotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <div className="flex flex-col items-center w-full h-full">
      {!isLoading && !error && numPages && (
        <div className="flex items-center gap-2 p-2 bg-card rounded-full mb-4 shadow-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Prev</span>
          </Button>
          <span className="text-sm px-2">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
            <span className="sr-only">Zoom Out</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-5 w-5" />
            <span className="sr-only">Zoom In</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={rotate}>
            <RotateCw className="h-5 w-5" />
            <span className="sr-only">Rotate</span>
          </Button>
        </div>
      )}

      <div className="relative flex-grow w-full h-full flex justify-center items-center overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p>Loading document...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to render PDF</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error.message}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        )}

        {!error && (
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={pdfOptions}
            externalLinkTarget="_blank"
            className="flex justify-center"
          >
            {numPages && (
              <Page
                key={pageNumber}
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-md"
              />
            )}
          </Document>
        )}
      </div>
    </div>
  )
}
