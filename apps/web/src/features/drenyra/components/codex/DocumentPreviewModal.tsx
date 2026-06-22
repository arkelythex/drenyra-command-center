import { useCallback, useEffect, useState } from "react";
import { X, Download, FileText, FileImage, FileSpreadsheet } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL to the file (signed URL or /api path) */
  url: string | null;
  fileName: string;
  mimeType?: string;
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return <FileText className="h-5 w-5" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function isPdf(mimeType?: string, fileName?: string): boolean {
  if (mimeType?.includes("pdf")) return true;
  if (fileName?.toLowerCase().endsWith(".pdf")) return true;
  return false;
}

function isImage(mimeType?: string, fileName?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  if (fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return true;
  return false;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  url,
  fileName,
  mimeType,
}: DocumentPreviewModalProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      setLoadError(false);
      setIsLoading(true);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const showPdf = isPdf(mimeType, fileName) && url;
  const showImage = isImage(mimeType, fileName) && url;
  const showFallback = !showPdf && !showImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal container */}
      <div className="relative mx-4 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(mimeType)}
            <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {fileName}
            </h2>
            {mimeType && (
              <span className="shrink-0 rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
                {mimeType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {url && showPdf && (
            <object
              data={url}
              type="application/pdf"
              className="h-full w-full rounded-lg"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setLoadError(true);
                setIsLoading(false);
              }}
            >
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    No se pudo renderizar el PDF en el navegador.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] underline underline-offset-2"
                  >
                    Abrir PDF en nueva pestaña
                  </a>
                </div>
              </div>
            </object>
          )}

          {url && showImage && (
            <div className="flex h-full items-center justify-center">
              {isLoading && (
                <div className="absolute text-sm text-[var(--text-tertiary)]">
                  Cargando...
                </div>
              )}
              <img
                src={url}
                alt={fileName}
                className="max-h-full max-w-full rounded-lg object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setLoadError(true);
                  setIsLoading(false);
                }}
              />
            </div>
          )}

          {showFallback && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              {getFileIcon(mimeType)}
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Vista previa no disponible
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Este tipo de archivo no se puede previsualizar en el navegador.
                </p>
              </div>
              {url && (
                <a
                  href={url}
                  download={fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary)]/90"
                >
                  <Download className="h-4 w-4" />
                  Descargar {fileName}
                </a>
              )}
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-1)]/80">
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-danger)]">
                  Error al cargar el archivo
                </p>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-[var(--color-primary)] underline underline-offset-2"
                  >
                    Intentar abrir directamente
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
