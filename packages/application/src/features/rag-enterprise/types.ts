/**
 * RAG Enterprise — DTO types for frontend consumption.
 *
 * @module application/features/rag-enterprise
 */

// ─── DTOs ───────────────────────────────────────────────────────

export interface CreateCollectionRequest {
	name: string;
	description?: string;
	icon?: string;
	embeddingModel?: string;
}

export interface UpdateCollectionRequest {
	name?: string;
	description?: string;
	icon?: string;
	embeddingModel?: string;
	isActive?: boolean;
}

export interface CollectionDTO {
	id: string;
	companyId: string;
	name: string;
	description: string | null;
	icon: string;
	documentCount: number;
	embeddingModel: string;
	createdById: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DocumentDTO {
	id: string;
	collectionId: string;
	companyId: string;
	title: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	source: string;
	pageCount: number | null;
	chunkCount: number;
	status: string;
	error: string | null;
	uploadedById: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ChunkDTO {
	id: string;
	documentId: string;
	chunkIndex: number;
	content: string;
	tokenCount: number | null;
	metadata: Record<string, unknown>;
}

export interface DocumentDetailDTO extends DocumentDTO {
	chunks: ChunkDTO[];
}

export interface QueryRequest {
	collectionId: string;
	query: string;
	topK?: number;
	minScore?: number;
}

export interface QueryResultDTO {
	chunk: ChunkDTO;
	documentId: string;
	documentTitle: string;
	score: number;
}

export interface QueryResponseDTO {
	results: QueryResultDTO[];
	queryId: string;
	latencyMs: number;
}

export interface QueryFeedbackRequest {
	feedback: boolean;
}

export interface CollectionStatsDTO {
	collectionId: string;
	name: string;
	documentCount: number;
	chunkCount: number;
	totalSizeBytes: number;
	queryCount: number;
}

export interface RAGDashboardStatsDTO {
	totalCollections: number;
	totalDocuments: number;
	totalChunks: number;
	totalQueries: number;
	recentQueries: unknown[];
}
