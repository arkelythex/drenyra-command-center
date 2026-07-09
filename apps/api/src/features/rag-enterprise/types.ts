import type { KbChunk, KbQuery } from "@drenyra/persistence/schema";

// --- REQUEST TYPES ---

export interface CreateCollectionBody {
	name: string;
	description?: string;
	icon?: string;
	embeddingModel?: string;
}

export interface UpdateCollectionBody {
	name?: string;
	description?: string;
	icon?: string;
	embeddingModel?: string;
	isActive?: boolean;
}

export interface QueryBody {
	collectionId: string;
	query: string;
	topK?: number;
	minScore?: number;
}

export interface QueryFeedbackBody {
	feedback: boolean;
}

// --- RESPONSE TYPES ---

export interface CollectionResponse {
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

export interface DocumentResponse {
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

export interface ChunkResponse {
	id: string;
	documentId: string;
	chunkIndex: number;
	content: string;
	tokenCount: number | null;
	metadata: Record<string, unknown>;
}

export interface DocumentDetailResponse extends DocumentResponse {
	chunks: ChunkResponse[];
}

export interface QueryResult {
	chunk: ChunkResponse;
	documentId: string;
	documentTitle: string;
	score: number;
}

export interface QueryResponse {
	results: QueryResult[];
	queryId: string;
	latencyMs: number;
}

export interface CollectionStats {
	collectionId: string;
	name: string;
	documentCount: number;
	chunkCount: number;
	totalSizeBytes: number;
	queryCount: number;
}

export interface DashboardStats {
	totalCollections: number;
	totalDocuments: number;
	totalChunks: number;
	totalQueries: number;
	recentQueries: KbQuery[];
}

// --- INTERNAL ---

export interface SearchableChunk extends KbChunk {
	documentTitle?: string;
}

export interface ScoredChunk extends SearchableChunk {
	score: number;
}
