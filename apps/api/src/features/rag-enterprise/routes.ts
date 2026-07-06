import {
	db,
	kbChunks,
	kbCollections,
	kbDocuments,
	kbQueries,
} from "@drenyra/persistence";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, ok } from "../shared/api-response";

const DEFAULT_TOP_K = 10;
const DEFAULT_MIN_SCORE = 0.1;
const STOP_WORDS = new Set([
	"el",
	"la",
	"los",
	"las",
	"un",
	"una",
	"unos",
	"unas",
	"de",
	"del",
	"en",
	"por",
	"para",
	"con",
	"sin",
	"su",
	"sus",
	"que",
	"es",
	"se",
	"no",
	"a",
	"e",
	"o",
	"y",
	"lo",
	"le",
	"les",
	"this",
	"that",
	"the",
	"and",
	"for",
	"with",
	"from",
	"what",
	"when",
	"where",
	"how",
	"are",
	"is",
	"was",
	"were",
	"been",
	"has",
	"have",
	"had",
	"does",
	"do",
	"did",
	"will",
	"would",
	"could",
	"should",
	"may",
	"might",
	"shall",
	"can",
]);

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-záéíóúüñ0-9]+/g)
		.filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreChunkByKeywords(content: string, keywords: string[]): number {
	const lower = content.toLowerCase();
	let score = 0;
	const matched = new Set<string>();

	for (const kw of keywords) {
		const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
		const matches = lower.match(regex);
		if (matches) {
			score += matches.length * 2;
			matched.add(kw);
		}
	}

	if (matched.size === 0) return 0;

	const wordCount = lower.split(/\s+/).length;
	const density = score / Math.max(wordCount, 1);
	const coverageRatio = matched.size / keywords.length;

	return (density * 0.6 + coverageRatio * 0.4) * 10;
}

function readHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

type Ctx =
	| { ok: true; companyId: string; userId: string }
	| { ok: false; status: number; error: ReturnType<typeof fail> };

function resolveContext(headers: Record<string, string | undefined>): Ctx {
	const companyId = readHeader(headers, "x-company-id");
	const userId = readHeader(headers, "x-user-id");

	if (!companyId) {
		return {
			ok: false,
			status: 400,
			error: fail(
				"x-company-id header is required",
				"TENANT_CONTEXT_REQUIRED",
				{
					details: { missingHeaders: ["x-company-id"] },
				},
			),
		};
	}

	return { ok: true, companyId, userId: userId || "system" };
}

export const ragEnterpriseRoutes = new Elysia({
	prefix: "/api/v1/rag",
	name: "rag-enterprise",
}).use(companyScopeGuard({ allowHeaderFallback: true }));

// ─── COLLECTIONS ────────────────────────────────────────────────

ragEnterpriseRoutes.post(
	"/collections",
	async ({ body, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [collection] = await db
			.insert(kbCollections)
			.values({
				companyId: ctx.companyId,
				name: body.name,
				description: body.description ?? null,
				icon: body.icon ?? "folder",
				embeddingModel: body.embeddingModel ?? "text-embedding-3-small",
				createdById: ctx.userId !== "system" ? ctx.userId : null,
			})
			.returning()
			.execute();

		return ok(collection);
	},
	{
		body: t.Object({
			name: t.String({ minLength: 1, maxLength: 255 }),
			description: t.Optional(t.String()),
			icon: t.Optional(t.String({ maxLength: 64 })),
			embeddingModel: t.Optional(t.String({ maxLength: 128 })),
		}),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Create collection",
			description: "Create a new knowledge base collection",
		},
	},
);

ragEnterpriseRoutes.get(
	"/collections",
	async ({ headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const collections = await db
			.select()
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.companyId, ctx.companyId),
					eq(kbCollections.isActive, true),
				),
			)
			.orderBy(desc(kbCollections.updatedAt))
			.execute();

		return ok(collections);
	},
	{
		detail: {
			tags: ["RAG Enterprise"],
			summary: "List collections",
			description: "List all active collections for the company",
		},
	},
);

ragEnterpriseRoutes.get(
	"/collections/:id",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [collection] = await db
			.select()
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, params.id),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!collection) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		return ok(collection);
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Get collection",
			description: "Get a single collection by ID",
		},
	},
);

ragEnterpriseRoutes.put(
	"/collections/:id",
	async ({ params, body, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [existing] = await db
			.select({ id: kbCollections.id })
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, params.id),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!existing) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		const [updated] = await db
			.update(kbCollections)
			.set({
				...(body.name !== undefined && { name: body.name }),
				...(body.description !== undefined && {
					description: body.description,
				}),
				...(body.icon !== undefined && { icon: body.icon }),
				...(body.embeddingModel !== undefined && {
					embeddingModel: body.embeddingModel,
				}),
				...(body.isActive !== undefined && { isActive: body.isActive }),
				updatedAt: new Date(),
			})
			.where(eq(kbCollections.id, params.id))
			.returning()
			.execute();

		return ok(updated);
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		body: t.Object({
			name: t.Optional(t.String({ maxLength: 255 })),
			description: t.Optional(t.String()),
			icon: t.Optional(t.String({ maxLength: 64 })),
			embeddingModel: t.Optional(t.String({ maxLength: 128 })),
			isActive: t.Optional(t.Boolean()),
		}),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Update collection",
			description: "Update a collection's metadata",
		},
	},
);

ragEnterpriseRoutes.delete(
	"/collections/:id",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [existing] = await db
			.select({ id: kbCollections.id })
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, params.id),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!existing) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		await db
			.delete(kbCollections)
			.where(eq(kbCollections.id, params.id))
			.execute();

		return ok({ deleted: true });
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Delete collection",
			description: "Delete a collection and all its documents and chunks",
		},
	},
);

// ─── DOCUMENTS ──────────────────────────────────────────────────

ragEnterpriseRoutes.post(
	"/collections/:id/upload",
	async ({ params, body, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [collection] = await db
			.select({ id: kbCollections.id, companyId: kbCollections.companyId })
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, params.id),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!collection) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		const textContent =
			typeof body.content === "string"
				? body.content
				: JSON.stringify(body.content);

		const [document] = await db
			.insert(kbDocuments)
			.values({
				collectionId: params.id,
				companyId: ctx.companyId,
				title: body.title,
				fileName: body.fileName,
				fileType: body.fileType,
				fileSize: body.fileSize ?? Buffer.byteLength(textContent, "utf-8"),
				source: body.source ?? "api",
				content: textContent,
				status: "ready",
				uploadedById: ctx.userId !== "system" ? ctx.userId : null,
				metadata: body.metadata ?? {},
			})
			.returning()
			.execute();

		const text = document.content || "";
		const words = text.split(/\s+/).filter(Boolean);
		const avgTokensPerWord = 1.3;
		const maxChunkSize = 1000;
		const chunks: (typeof kbChunks.$inferInsert)[] = [];
		const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

		let currentChunk: string[] = [];
		let currentTokens = 0;
		let chunkIndex = 0;

		for (const sentence of sentences) {
			const sentenceTokens = Math.ceil(
				sentence.split(/\s+/).filter(Boolean).length * avgTokensPerWord,
			);

			if (
				currentTokens + sentenceTokens > maxChunkSize &&
				currentChunk.length > 0
			) {
				const chunkText = currentChunk.join(" ");
				chunks.push({
					documentId: document.id,
					chunkIndex: chunkIndex++,
					content: chunkText,
					tokenCount: currentTokens,
					metadata: {},
				});
				currentChunk = [];
				currentTokens = 0;
			}

			currentChunk.push(sentence);
			currentTokens += sentenceTokens;
		}

		if (currentChunk.length > 0) {
			const chunkText = currentChunk.join(" ");
			chunks.push({
				documentId: document.id,
				chunkIndex: chunkIndex++,
				content: chunkText,
				tokenCount: currentTokens,
				metadata: {},
			});
		}

		if (chunks.length > 0) {
			await db.insert(kbChunks).values(chunks).execute();
		}

		await db
			.update(kbDocuments)
			.set({
				chunkCount: chunks.length,
				status: "ready",
			})
			.where(eq(kbDocuments.id, document.id))
			.execute();

		await db
			.update(kbCollections)
			.set({
				documentCount: sql`${kbCollections.documentCount} + 1`,
				updatedAt: new Date(),
			})
			.where(eq(kbCollections.id, params.id))
			.execute();

		return ok({
			...document,
			chunkCount: chunks.length,
		});
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		body: t.Object({
			title: t.String({ minLength: 1, maxLength: 512 }),
			fileName: t.String({ minLength: 1, maxLength: 512 }),
			fileType: t.Enum({
				pdf: "pdf",
				txt: "txt",
				csv: "csv",
				docx: "docx",
				html: "html",
				markdown: "markdown",
			}),
			fileSize: t.Optional(t.Integer({ minimum: 0 })),
			content: t.String(),
			source: t.Optional(
				t.Enum({
					upload: "upload",
					email: "email",
					webhook: "webhook",
					api: "api",
				}),
			),
			metadata: t.Optional(t.Record(t.String(), t.Any())),
		}),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Upload document",
			description:
				"Upload a document to a collection, extracts text and creates chunks",
		},
	},
);

ragEnterpriseRoutes.get(
	"/collections/:id/documents",
	async ({ params, query, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const conditions = [
			eq(kbDocuments.collectionId, params.id),
			eq(kbDocuments.companyId, ctx.companyId),
		];

		if (query.status) {
			conditions.push(eq(kbDocuments.status, query.status));
		}

		const docs = await db
			.select()
			.from(kbDocuments)
			.where(and(...conditions))
			.orderBy(desc(kbDocuments.createdAt))
			.limit(query.limit ?? 50)
			.offset(query.offset ?? 0)
			.execute();

		const [{ count: total }] = await db
			.select({ count: count() })
			.from(kbDocuments)
			.where(and(...conditions))
			.execute();

		return ok({
			documents: docs,
			total,
			limit: query.limit ?? 50,
			offset: query.offset ?? 0,
		});
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		query: t.Object({
			status: t.Optional(
				t.Enum({
					uploading: "uploading",
					processing: "processing",
					indexing: "indexing",
					ready: "ready",
					error: "error",
				}),
			),
			limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 200 })),
			offset: t.Optional(t.Numeric({ default: 0, minimum: 0 })),
		}),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "List documents",
			description: "List documents in a collection",
		},
	},
);

ragEnterpriseRoutes.get(
	"/documents/:id",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [document] = await db
			.select()
			.from(kbDocuments)
			.where(
				and(
					eq(kbDocuments.id, params.id),
					eq(kbDocuments.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!document) {
			set.status = 404;
			return fail("Document not found", "NOT_FOUND");
		}

		const chunks = await db
			.select()
			.from(kbChunks)
			.where(eq(kbChunks.documentId, document.id))
			.orderBy(asc(kbChunks.chunkIndex))
			.execute();

		return ok({ ...document, chunks });
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Get document",
			description: "Get document detail with chunks",
		},
	},
);

ragEnterpriseRoutes.delete(
	"/documents/:id",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [document] = await db
			.select({
				id: kbDocuments.id,
				collectionId: kbDocuments.collectionId,
				chunkCount: kbDocuments.chunkCount,
			})
			.from(kbDocuments)
			.where(
				and(
					eq(kbDocuments.id, params.id),
					eq(kbDocuments.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!document) {
			set.status = 404;
			return fail("Document not found", "NOT_FOUND");
		}

		await db.delete(kbDocuments).where(eq(kbDocuments.id, params.id)).execute();

		await db
			.update(kbCollections)
			.set({
				documentCount: sql`GREATEST(${kbCollections.documentCount} - 1, 0)`,
				updatedAt: new Date(),
			})
			.where(eq(kbCollections.id, document.collectionId))
			.execute();

		return ok({ deleted: true });
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Delete document",
			description: "Delete a document and all its chunks",
		},
	},
);

ragEnterpriseRoutes.post(
	"/documents/:id/reindex",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [document] = await db
			.select()
			.from(kbDocuments)
			.where(
				and(
					eq(kbDocuments.id, params.id),
					eq(kbDocuments.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!document) {
			set.status = 404;
			return fail("Document not found", "NOT_FOUND");
		}

		await db
			.delete(kbChunks)
			.where(eq(kbChunks.documentId, params.id))
			.execute();

		const text = document.content || "";
		const avgTokensPerWord = 1.3;
		const maxChunkSize = 1000;
		const chunks: (typeof kbChunks.$inferInsert)[] = [];
		const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

		let currentChunk: string[] = [];
		let currentTokens = 0;
		let chunkIndex = 0;

		for (const sentence of sentences) {
			const sentenceTokens = Math.ceil(
				sentence.split(/\s+/).filter(Boolean).length * avgTokensPerWord,
			);

			if (
				currentTokens + sentenceTokens > maxChunkSize &&
				currentChunk.length > 0
			) {
				const chunkText = currentChunk.join(" ");
				chunks.push({
					documentId: document.id,
					chunkIndex: chunkIndex++,
					content: chunkText,
					tokenCount: currentTokens,
					metadata: (document.metadata as Record<string, unknown>) ?? {},
				});
				currentChunk = [];
				currentTokens = 0;
			}

			currentChunk.push(sentence);
			currentTokens += sentenceTokens;
		}

		if (currentChunk.length > 0) {
			const chunkText = currentChunk.join(" ");
			chunks.push({
				documentId: document.id,
				chunkIndex: chunkIndex++,
				content: chunkText,
				tokenCount: currentTokens,
				metadata: (document.metadata as Record<string, unknown>) ?? {},
			});
		}

		if (chunks.length > 0) {
			await db.insert(kbChunks).values(chunks).execute();
		}

		const [updated] = await db
			.update(kbDocuments)
			.set({
				chunkCount: chunks.length,
				status: "ready",
				updatedAt: new Date(),
			})
			.where(eq(kbDocuments.id, params.id))
			.returning()
			.execute();

		return ok(updated);
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Reindex document",
			description: "Delete and re-create chunks for a document",
		},
	},
);

// ─── QUERY ──────────────────────────────────────────────────────

ragEnterpriseRoutes.post(
	"/query",
	async ({ body, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const startTime = Date.now();
		const topK = body.topK ?? DEFAULT_TOP_K;
		const minScore = body.minScore ?? DEFAULT_MIN_SCORE;

		const keywords = tokenize(body.query);
		if (keywords.length === 0) {
			set.status = 400;
			return fail("Query must contain meaningful keywords", "VALIDATION_ERROR");
		}

		const [collection] = await db
			.select({ id: kbCollections.id, companyId: kbCollections.companyId })
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, body.collectionId),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!collection) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		const docsInCollection = await db
			.select({ id: kbDocuments.id })
			.from(kbDocuments)
			.where(
				and(
					eq(kbDocuments.collectionId, body.collectionId),
					eq(kbDocuments.status, "ready"),
				),
			)
			.execute();

		if (docsInCollection.length === 0) {
			const latencyMs = Date.now() - startTime;
			const [qb] = await db
				.insert(kbQueries)
				.values({
					companyId: ctx.companyId,
					collectionId: body.collectionId,
					query: body.query,
					response: "No documents found in collection",
					chunksUsed: [],
					modelUsed: "keyword-search",
					latencyMs,
					createdById: ctx.userId !== "system" ? ctx.userId : null,
				})
				.returning()
				.execute();

			return ok({ results: [], queryId: qb.id, latencyMs });
		}

		const docIds = docsInCollection.map((d) => d.id);

		const docTitles = new Map(docsInCollection.map((d) => [d.id, d.id]));

		const docsWithTitles = await db
			.select({ id: kbDocuments.id, title: kbDocuments.title })
			.from(kbDocuments)
			.where(inArray(kbDocuments.id, docIds))
			.execute();

		for (const d of docsWithTitles) {
			docTitles.set(d.id, d.title);
		}

		const ilikeConditions = keywords.map((kw) =>
			ilike(kbChunks.content, `%${kw}%`),
		);
		const allChunks = await db
			.select()
			.from(kbChunks)
			.where(and(inArray(kbChunks.documentId, docIds), or(...ilikeConditions)))
			.orderBy(asc(kbChunks.chunkIndex))
			.limit(500)
			.execute();

		const scored = allChunks
			.map((chunk) => ({
				...chunk,
				documentTitle: docTitles.get(chunk.documentId) ?? "Unknown",
				score: scoreChunkByKeywords(chunk.content, keywords),
			}))
			.filter((c) => c.score >= minScore)
			.sort((a, b) => b.score - a.score)
			.slice(0, topK);

		const latencyMs = Date.now() - startTime;

		const queryResponse =
			scored.length > 0
				? scored
						.slice(0, 3)
						.map((c) => c.content)
						.join("\n\n---\n\n")
				: "No relevant results found";

		const [qb] = await db
			.insert(kbQueries)
			.values({
				companyId: ctx.companyId,
				collectionId: body.collectionId,
				query: body.query,
				response: queryResponse,
				chunksUsed: scored.map((c) => c.id),
				modelUsed: "keyword-search",
				latencyMs,
				createdById: ctx.userId !== "system" ? ctx.userId : null,
			})
			.returning()
			.execute();

		return ok({
			results: scored.map((c) => ({
				chunk: {
					id: c.id,
					documentId: c.documentId,
					chunkIndex: c.chunkIndex,
					content: c.content,
					tokenCount: c.tokenCount,
					metadata: c.metadata as Record<string, unknown>,
				},
				documentId: c.documentId,
				documentTitle: c.documentTitle,
				score: c.score,
			})),
			queryId: qb.id,
			latencyMs,
		});
	},
	{
		body: t.Object({
			collectionId: t.String({ format: "uuid" }),
			query: t.String({ minLength: 1, maxLength: 1000 }),
			topK: t.Optional(t.Numeric({ default: 10, minimum: 1, maximum: 50 })),
			minScore: t.Optional(t.Numeric({ default: 0.1, minimum: 0, maximum: 1 })),
		}),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Query knowledge base",
			description: "Semantic keyword search across a collection's chunks",
		},
	},
);

ragEnterpriseRoutes.post(
	"/queries/:id/feedback",
	async ({ params, body, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [existing] = await db
			.select({ id: kbQueries.id })
			.from(kbQueries)
			.where(
				and(
					eq(kbQueries.id, params.id),
					eq(kbQueries.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!existing) {
			set.status = 404;
			return fail("Query not found", "NOT_FOUND");
		}

		await db
			.update(kbQueries)
			.set({ feedback: body.feedback })
			.where(eq(kbQueries.id, params.id))
			.execute();

		return ok({ updated: true });
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		body: t.Object({ feedback: t.Boolean() }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Query feedback",
			description: "Mark a query result as helpful or not",
		},
	},
);

// ─── STATISTICS ─────────────────────────────────────────────────

ragEnterpriseRoutes.get(
	"/collections/:id/stats",
	async ({ params, headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [collection] = await db
			.select()
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.id, params.id),
					eq(kbCollections.companyId, ctx.companyId),
				),
			)
			.limit(1)
			.execute();

		if (!collection) {
			set.status = 404;
			return fail("Collection not found", "NOT_FOUND");
		}

		const [{ count: chunkCount }] = await db
			.select({ count: count() })
			.from(kbChunks)
			.where(
				inArray(
					kbChunks.documentId,
					db
						.select({ id: kbDocuments.id })
						.from(kbDocuments)
						.where(eq(kbDocuments.collectionId, params.id)),
				),
			)
			.execute();

		const docs = await db
			.select({ fileSize: kbDocuments.fileSize })
			.from(kbDocuments)
			.where(eq(kbDocuments.collectionId, params.id))
			.execute();

		const totalSizeBytes = docs.reduce((acc, d) => acc + d.fileSize, 0);

		const [{ count: queryCount }] = await db
			.select({ count: count() })
			.from(kbQueries)
			.where(eq(kbQueries.collectionId, params.id))
			.execute();

		return ok({
			collectionId: collection.id,
			name: collection.name,
			documentCount: collection.documentCount,
			chunkCount,
			totalSizeBytes,
			queryCount,
		});
	},
	{
		params: t.Object({ id: t.String({ format: "uuid" }) }),
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Collection stats",
			description: "Get usage statistics for a collection",
		},
	},
);

ragEnterpriseRoutes.get(
	"/dashboard",
	async ({ headers, set }) => {
		const ctx = resolveContext(headers);
		if (!ctx.ok) {
			set.status = ctx.status;
			return ctx.error;
		}

		const [{ count: totalCollections }] = await db
			.select({ count: count() })
			.from(kbCollections)
			.where(
				and(
					eq(kbCollections.companyId, ctx.companyId),
					eq(kbCollections.isActive, true),
				),
			)
			.execute();

		const [{ count: totalDocuments }] = await db
			.select({ count: count() })
			.from(kbDocuments)
			.where(eq(kbDocuments.companyId, ctx.companyId))
			.execute();

		const [{ count: totalChunks }] = await db
			.select({ count: count() })
			.from(kbChunks)
			.where(
				inArray(
					kbChunks.documentId,
					db
						.select({ id: kbDocuments.id })
						.from(kbDocuments)
						.where(eq(kbDocuments.companyId, ctx.companyId)),
				),
			)
			.execute();

		const [{ count: totalQueries }] = await db
			.select({ count: count() })
			.from(kbQueries)
			.where(eq(kbQueries.companyId, ctx.companyId))
			.execute();

		const recentQueries = await db
			.select()
			.from(kbQueries)
			.where(eq(kbQueries.companyId, ctx.companyId))
			.orderBy(desc(kbQueries.createdAt))
			.limit(10)
			.execute();

		return ok({
			totalCollections,
			totalDocuments,
			totalChunks,
			totalQueries,
			recentQueries,
		});
	},
	{
		detail: {
			tags: ["RAG Enterprise"],
			summary: "Dashboard stats",
			description: "Get overall RAG usage statistics for the company",
		},
	},
);
