import { Elysia, t } from "elysia";
import type { CompanyContext } from "../../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { SireDiffCommitService } from "../services/sire-diff-commit.service";

const documentRecordSchema = t.Object({
	documentType: t.String(),
	series: t.String(),
	number: t.String(),
	issueDate: t.String(),
	total: t.Number(),
	currency: t.Union([t.Literal("PEN"), t.Literal("USD")]),
	ruc: t.Optional(t.String()),
	reasonSocial: t.Optional(t.String()),
});

const commitRowSchema = t.Object({
	rowId: t.String({ minLength: 1 }),
	status: t.Union([
		t.Literal("MATCH"),
		t.Literal("MISMATCH"),
		t.Literal("MISSING_LOCAL"),
		t.Literal("MISSING_SUNAT"),
	]),
	decision: t.Union([
		t.Literal("ACCEPT_SUNAT"),
		t.Literal("KEEP_LOCAL"),
		t.Literal("PENDING"),
	]),
	localRecord: t.Optional(documentRecordSchema),
	sunatRecord: t.Optional(documentRecordSchema),
});

export const sireDiffCommitRoute = new Elysia().post(
	"/diff/commit",
	async ({
		body,
		query,
		set,
		companyContext,
	}: {
		body: {
			period: string;
			artifactId: string;
			traceId: string;
			sunatSource: "upload" | "persisted" | "unavailable";
			summary: {
				matched: number;
				mismatched: number;
				missingOnLedger: number;
				missingOnSunat: number;
				critical: number;
				totalDifference: number;
			};
			rows: Array<{
				rowId: string;
				status: "MATCH" | "MISMATCH" | "MISSING_LOCAL" | "MISSING_SUNAT";
				decision: "ACCEPT_SUNAT" | "KEEP_LOCAL" | "PENDING";
				localRecord?: {
					documentType: string;
					series: string;
					number: string;
					issueDate: string;
					total: number;
					currency: "PEN" | "USD";
					ruc?: string;
					reasonSocial?: string;
				};
				sunatRecord?: {
					documentType: string;
					series: string;
					number: string;
					issueDate: string;
					total: number;
					currency: "PEN" | "USD";
					ruc?: string;
					reasonSocial?: string;
				};
			}>;
		};
		query: { companyId: string };
		set: { status: number };
		companyContext: CompanyContext;
	}) => {
		if (query.companyId !== companyContext.companyId) {
			set.status = 403;
			return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
		}

		try {
			const result = await SireDiffCommitService.commitResolutions({
				companyId: query.companyId,
				period: body.period,
				artifactId: body.artifactId,
				traceId: body.traceId,
				sunatSource: body.sunatSource,
				summary: body.summary,
				rows: body.rows,
				actorUserId: companyContext.authUserId,
			});
			return ok(result);
		} catch (error) {
			const message = getErrorMessage(error);
			if (message.includes("pending") || message.includes("Upload")) {
				set.status = 409;
				return fail(message, "SIRE_DIFF_COMMIT_BLOCKED");
			}
			set.status = 500;
			return fail(message, "SIRE_DIFF_COMMIT_ERROR");
		}
	},
	{
		query: t.Object({
			companyId: t.String({ minLength: 1 }),
		}),
		body: t.Object({
			period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			artifactId: t.String({ minLength: 1 }),
			traceId: t.String({ minLength: 1 }),
			sunatSource: t.Union([
				t.Literal("upload"),
				t.Literal("persisted"),
				t.Literal("unavailable"),
			]),
			summary: t.Object({
				matched: t.Number(),
				mismatched: t.Number(),
				missingOnLedger: t.Number(),
				missingOnSunat: t.Number(),
				critical: t.Number(),
				totalDifference: t.Number(),
			}),
			rows: t.Array(commitRowSchema),
		}),
		detail: {
			tags: ["SIRE"],
			summary: "Commit accountant SIRE diff resolutions",
			description:
				"Applies ACCEPT_SUNAT ledger mutations and persists governance audit events.",
		},
	},
);
