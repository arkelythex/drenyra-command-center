import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { processInbox } from "./application/commands/process-inbox";
import { uploadDocument } from "./application/commands/upload-document";
import { getConversation } from "./application/queries/get-conversation";

const DEFAULT_DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

function resolveCompanyIdFromHeaders(headers: Headers): string {
	const companyId = headers.get("x-company-id")?.trim();
	return companyId || DEFAULT_DEMO_COMPANY_ID;
}

function collectFiles(body: {
	file?: File | File[];
	files?: File | File[];
}): File[] {
	const fromFiles = body.files;
	const fromFile = body.file;
	const merged: File[] = [];

	const push = (value: File | File[] | undefined) => {
		if (!value) return;
		if (Array.isArray(value)) {
			merged.push(...value);
			return;
		}
		merged.push(value);
	};

	push(fromFiles);
	push(fromFile);

	return merged.filter((file) => file.size > 0);
}

/**
 * Smart Inbox API — upload + agent pipeline SSE.
 * @see docs/superpowers/specs/2026-05-23-smart-inbox-design.md
 */
export const inboxModule = new Elysia({ prefix: "/api/inbox" })
	.use(companyScopeGuard())
	.post(
		"/process",
		async ({ body, request, set }) => {
			const files = collectFiles(body);
			if (files.length === 0) {
				set.status = 400;
				return fail("No files uploaded", "INBOX_FILES_REQUIRED");
			}

			const companyId = resolveCompanyIdFromHeaders(request.headers);
			const { stream, batchId } = await processInbox({ companyId, files });

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream; charset=utf-8",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Inbox-Batch-Id": batchId,
				},
			});
		},
		{
			body: z.object({
				file: z
					.union([z.instanceof(File), z.array(z.instanceof(File))])
					.optional(),
				files: z
					.union([z.instanceof(File), z.array(z.instanceof(File))])
					.optional(),
			}),
			detail: {
				tags: ["Inbox"],
				summary: "Process invoice batch with live agent SSE stream",
			},
		},
	)
	.get(
		"/conversation",
		async ({ query }) => {
			const question = query.q?.trim() ?? "";
			if (!question) {
				return fail("Missing query q", "INBOX_CONVERSATION_QUERY_REQUIRED");
			}

			const result = await getConversation({ question });
			return ok(result);
		},
		{
			query: z.object({
				q: z.string().min(1),
			}),
			detail: {
				tags: ["Inbox"],
				summary: "Contextual inbox conversation (deterministic MVP)",
			},
		},
	)
	.post(
		"/upload",
		async ({ body, request, set }) => {
			const { file } = body;

			if (!file) {
				set.status = 400;
				return fail("No file uploaded", "INBOX_FILE_REQUIRED");
			}

			try {
				const companyId = resolveCompanyIdFromHeaders(request.headers);
				const result = await uploadDocument({ file, companyId });
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(error, "Upload failed"),
					"INBOX_UPLOAD_FAILED",
				);
			}
		},
		{
			body: z.object({
				file: z.instanceof(File),
			}),
			detail: {
				tags: ["Inbox"],
				summary: "Upload XML/PDF document to inbox (legacy JSON)",
			},
		},
	);

export type { InboxSseEvent } from "./inbox.types";
