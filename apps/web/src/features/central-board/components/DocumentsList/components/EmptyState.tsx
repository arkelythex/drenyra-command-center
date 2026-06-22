"use client";

import { Upload } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Upload size={28} className="mb-3 text-[var(--text-muted)]" />
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        No hay documentos
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Arrastrá archivos al área de arriba para subirlos
      </p>
    </div>
  );
}
