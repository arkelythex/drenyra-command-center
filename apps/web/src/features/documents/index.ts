/**
 * Documents Feature - Public API
 *
 * Centralized exports for document management.
 */

// Components
export { DocumentsView } from "./components/DocumentsView";

// Shared Components
export { DocumentStatusBadge } from "./components/shared/DocumentStatusBadge";
export { documentsKeys, documentsQueryOptions } from "./documents.query";
// Hooks
export { useDocuments } from "./hooks/useDocuments";

// Types
export type { Document, DocumentStatus } from "./types/document.types";
