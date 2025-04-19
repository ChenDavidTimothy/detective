'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'

// Dynamically import react-pdf with no SSR to avoid hydration issues
const PDFViewer = dynamic(
  () => import('./PDFViewer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <PDFLoadingFallback /> }
)

// Separate loading component for better UX
function PDFLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Loading PDF viewer...</p>
    </div>
  )
}

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  title?: string
}

export function DocumentModal({
  isOpen,
  onClose,
  documentUrl,
  title,
}: DocumentModalProps) {
  const [fetchStatus, setFetchStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !documentUrl) return

    setFetchStatus('loading')
    setFetchError(null)

    fetch(documentUrl, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`)
        setFetchStatus('success')
      })
      .catch((err) => {
        console.error('Document URL fetch error:', err)
        setFetchStatus('error')
        setFetchError(`Could not access document: ${err.message}`)
      })
  }, [isOpen, documentUrl])

  useEffect(() => {
    if (!isOpen) {
      setFetchStatus('idle')
      setFetchError(null)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogTitle className="sr-only">{title || 'Document'}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center space-x-4">
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {fetchStatus === 'loading' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Loading document...
              </Badge>
            )}
            {fetchStatus === 'error' && <Badge variant="destructive">Error</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {fetchStatus === 'success' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(documentUrl, '_blank')}
                className="text-xs"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow relative flex justify-center items-center p-4 bg-muted overflow-auto">
          {fetchStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Verifying document URL...</p>
            </div>
          )}

          {fetchStatus === 'error' && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
                <p className="text-destructive font-medium mb-3">
                  Failed to load document
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {fetchError}
                </p>
                <Button
                  onClick={() => window.open(documentUrl, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Try in New Tab
                </Button>
              </div>
            </div>
          )}

          {fetchStatus === 'success' && (
            <PDFViewer documentUrl={documentUrl} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
