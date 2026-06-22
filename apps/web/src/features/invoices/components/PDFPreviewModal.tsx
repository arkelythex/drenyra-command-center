import React from 'react';
/**
 * PDF Preview Modal
 * Modal component for previewing invoice PDFs
 */

import { useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePreviewInvoicePDF, useDownloadInvoicePDF } from '../hooks/usePDFActions';

interface PDFPreviewModalProps {
  invoiceId: string;
  invoiceNumber: string;
  onClose: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  invoiceId,
  invoiceNumber,
  onClose,
}) => {
  const previewMutation = usePreviewInvoicePDF();
  const downloadMutation = useDownloadInvoicePDF();

  // Generate preview on mount
  useEffect(() => {
    previewMutation.mutate(invoiceId);
    
    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (previewMutation.data?.url) {
        window.URL.revokeObjectURL(previewMutation.data.url);
      }
    };
  }, [invoiceId]);

  const handleDownload = () => {
    downloadMutation.mutate(invoiceId);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa - {invoiceNumber}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/50">
          {previewMutation.isPending && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Generando vista previa...
                </p>
              </div>
            </div>
          )}

          {previewMutation.isError && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive">
                  Error al generar vista previa
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => previewMutation.mutate(invoiceId)}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {previewMutation.isSuccess && previewMutation.data && (
            <iframe
              src={previewMutation.data.url}
              className="h-full w-full"
              title={`Vista previa - ${invoiceNumber}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
