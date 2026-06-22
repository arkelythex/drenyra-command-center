import { z } from "zod";

/**
 * Zod schema for listing agent runs with optional filters.
 */
export const ListRunsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  status: z
    .enum(["running", "completed", "failed", "manual_review", "degraded"])
    .optional(),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Zod schema for run events params.
 */
export const ListEventsParamsSchema = z.object({
  runId: z.string().uuid(),
});

/**
 * Zod schema for listing run events query.
 */
export const ListEventsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(50),
});

/**
 * Zod schema for a single status count entry (used internally).
 */
export const RunSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  manualReview: z.number().int().nonnegative(),
  degraded: z.number().int().nonnegative(),
});

export type ListRunsQuery = z.infer<typeof ListRunsQuerySchema>;
export type ListEventsParams = z.infer<typeof ListEventsParamsSchema>;
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>;
export type RunSummary = z.infer<typeof RunSummarySchema>;

// --- Batch schemas ---

export const CreateBatchBodySchema = z.object({
  invoices: z
    .array(
      z.object({
        type: z.enum(["image", "pdf", "xml"]),
        data: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1, "At least one invoice is required"),
  maxConcurrent: z.coerce.number().int().min(1).max(10).default(3).optional(),
});

export const BatchDetailSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(["pending", "running", "completed", "failed", "partial", "cancelled"]),
  total: z.number().int(),
  completed: z.number().int(),
  failed: z.number().int(),
  sessionId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      batchId: z.string().uuid(),
      runId: z.string().uuid(),
      status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
      error: z.string().nullable(),
      createdAt: z.string().datetime(),
    }),
  ),
});

export const BatchListItemSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(["pending", "running", "completed", "failed", "partial", "cancelled"]),
  total: z.number().int(),
  completed: z.number().int(),
  failed: z.number().int(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const BatchListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(BatchListItemSchema),
});

export const BatchDetailResponseSchema = z.object({
  success: z.literal(true),
  data: BatchDetailSchema,
});

export const CreateBatchResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ batchId: z.string().uuid() }),
});

export const BatchListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export const BatchParamsSchema = z.object({
  batchId: z.string().uuid(),
});

export const BatchCancelParamsSchema = z.object({
  batchId: z.string().uuid(),
});

// --- Memory schemas ---

export const CompanyMemoryParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const CompanyMemoryResponseSchema = z.object({
  summary: z.string().nullable(),
  recentRuns: z.number().int().nonnegative(),
  companyId: z.string(),
});

export const MemoryEntrySchema = z.object({
  runId: z.string(),
  memorySummary: z.string(),
  workflowState: z.string(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
});

export const MemoryHistoryResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(MemoryEntrySchema),
});

export type CompanyMemoryParams = z.infer<typeof CompanyMemoryParamsSchema>;
export type CompanyMemoryResponse = z.infer<typeof CompanyMemoryResponseSchema>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
export type MemoryHistoryResponse = z.infer<typeof MemoryHistoryResponseSchema>;
