import type { DocumentItem } from "@/stores/central-board-store";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "F001-000456.pdf",
    type: "pdf",
    size: 245_000,
    uploadedAt: new Date(Date.now() - 600_000).toISOString(),
    status: "ready",
  },
  {
    id: "doc-2",
    name: "extracto-bcp-ene2026.csv",
    type: "csv",
    size: 12_400,
    uploadedAt: new Date(Date.now() - 1_200_000).toISOString(),
    status: "ready",
  },
  {
    id: "doc-3",
    name: "factura-claro.png",
    type: "image",
    size: 1_200_000,
    uploadedAt: new Date(Date.now() - 2_400_000).toISOString(),
    status: "processing",
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileType(file: File): DocumentItem["type"] {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  if (
    file.type === "text/csv" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "xlsx";
  if (
    file.type === "application/vnd.ms-excel" ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  )
    return "xlsx";
  if (file.name.endsWith(".csv")) return "csv";
  return "other";
}

export function getFileIcon(type: DocumentItem["type"]) {
  switch (type) {
    case "pdf":
      return FileText;
    case "image":
      return FileImage;
    case "csv":
    case "xlsx":
      return FileSpreadsheet;
    default:
      return File;
  }
}

export const STATUS_CONFIG = {
  processing: {
    icon: Loader2,
    className: "text-[var(--color-warning)]",
    label: "Procesando…",
  },
  ready: {
    icon: FileText,
    className: "text-[var(--color-success)]",
    label: "Listo",
  },
  error: {
    icon: AlertCircle,
    className: "text-[var(--color-danger)]",
    label: "Error",
  },
} as const;
