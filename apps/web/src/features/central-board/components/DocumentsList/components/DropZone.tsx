"use client";

import type { DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";

interface DropZoneProps {
  isDragOver: boolean;
  isUploading: boolean;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function DropZone({
  isDragOver,
  isUploading,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}: DropZoneProps) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "mx-4 mt-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
        isDragOver
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
          : "border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]/30",
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={onFileSelect}
        accept=".pdf,.xml,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
        multiple
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2
              size={18}
              className="animate-spin text-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Subiendo archivos…
            </span>
          </div>
        ) : (
          <>
            <Upload
              size={22}
              className={cn(
                "mx-auto mb-2 transition-colors",
                isDragOver
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--text-muted)]",
              )}
            />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              {isDragOver
                ? "Soltá los archivos acá"
                : "Arrastrá y soltá archivos"}
            </p>
            <p className="mt-1 text-2xs text-[var(--text-muted)]">
              o click para seleccionar (PDF, CSV, XML, Excel, imágenes)
            </p>
          </>
        )}
      </label>
    </div>
  );
}
