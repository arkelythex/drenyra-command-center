/**
 * RAG Enterprise Feature Module
 *
 * Enterprise knowledge base with document management and keyword-based search.
 *
 * Routes:
 *   POST   /api/v1/rag/collections                — Create collection
 *   GET    /api/v1/rag/collections                — List collections
 *   GET    /api/v1/rag/collections/:id            — Get collection
 *   PUT    /api/v1/rag/collections/:id            — Update collection
 *   DELETE /api/v1/rag/collections/:id            — Delete collection
 *   POST   /api/v1/rag/collections/:id/upload     — Upload document
 *   GET    /api/v1/rag/collections/:id/documents   — List documents
 *   GET    /api/v1/rag/documents/:id              — Get document with chunks
 *   DELETE /api/v1/rag/documents/:id              — Delete document
 *   POST   /api/v1/rag/documents/:id/reindex      — Reindex document
 *   POST   /api/v1/rag/query                      — Query knowledge base
 *   POST   /api/v1/rag/queries/:id/feedback       — Query feedback
 *   GET    /api/v1/rag/collections/:id/stats      — Collection stats
 *   GET    /api/v1/rag/dashboard                  — Dashboard stats
 *
 * @module features/rag-enterprise
 */

export { ragEnterpriseRoutes } from "./routes";
