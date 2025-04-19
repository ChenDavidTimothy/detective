'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContentWithoutClose as DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFViewer } from '@/components/PDFViewer'
import { AlertCircle, FileText } from 'lucide-react'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  title?: string
  description?: string
  fileName?: string
}

export function DocumentModal({
  isOpen,
  onClose,
  documentUrl,
  title,
  description,
  fileName,
}: DocumentModalProps) {
  const [fetchStatus, setFetchStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !documentUrl) return

    setFetchStatus('loading')

    fetch(documentUrl, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`)
        setFetchStatus('success')
      })
      .catch((err) => {
        console.error('Document URL fetch error:', err)
        setFetchStatus('error')
      })
  }, [isOpen, documentUrl])

  useEffect(() => {
    if (!isOpen) {
      setFetchStatus('idle')
      setDownloadError(null)
    }
  }, [isOpen])

  const handleDownload = async () => {
    if (!documentUrl) return
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(documentUrl)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName || title || 'document'
      link.click()
    } catch (error) {
      console.error('Error downloading document:', error)
      setDownloadError('Error downloading document. Please try again later.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="sm:max-w-5xl w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-card sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <DialogTitle className="text-lg font-medium leading-tight">
                {title || fileName || 'Document'}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 pr-12">
            {fetchStatus === 'success' && documentUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-grow relative flex flex-col h-full overflow-hidden">
          {fetchStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium">Preparing document...</p>
              <p className="text-muted-foreground text-sm mt-1">This might take a moment.</p>
            </div>
          )}
          
          {fetchStatus === 'error' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-destructive">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Error accessing document</p>
              <p className="text-sm mt-1">There was a problem verifying the document URL. Please try again later.</p>
            </div>
          )}

          {downloadError && (
            <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md z-30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {downloadError}
            </div>
          )}

          {fetchStatus === 'success' && documentUrl && (
            <PDFViewer documentUrl={documentUrl} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
