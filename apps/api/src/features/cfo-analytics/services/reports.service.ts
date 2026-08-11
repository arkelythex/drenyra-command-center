import { db } from "@drenyra/persistence/client";
import { desc, eq } from "@drenyra/persistence/query";
import { analyticsReports } from "@drenyra/persistence/schema";
import type { ReportResult } from "../cfo-analytics.types";

export class ReportsService {
	static async generateReport(
		companyId: string,
		type: "financial" | "tax" | "client" | "custom",
		period?: string,
		parameters?: Record<string, unknown>,
		createdById?: string,
	): Promise<ReportResult> {
		const [report] = await db
			.insert(analyticsReports)
			.values({
				companyId,
				type,
				period: period || null,
				parameters: (parameters || {}) as Record<string, unknown>,
				status: "QUEUED",
				createdById: createdById || null,
			})
			.returning();

		if (!report) {
			throw new Error("Failed to generate report: no row returned");
		}

		await db
			.update(analyticsReports)
			.set({ status: "READY", generatedAt: new Date() })
			.where(eq(analyticsReports.id, report.id));

		return {
			id: report.id,
			type: report.type,
			status: "READY",
			...(report.period ? { period: report.period } : {}),
			generatedAt: new Date().toISOString(),
			createdAt: report.createdAt.toISOString(),
		};
	}

	static async listReports(companyId: string): Promise<ReportResult[]> {
		const reports = await db
			.select()
			.from(analyticsReports)
			.where(eq(analyticsReports.companyId, companyId))
			.orderBy(desc(analyticsReports.createdAt))
			.limit(50);

		return reports.map((r) => ({
			id: r.id,
			type: r.type,
			status: r.status,
			...(r.period ? { period: r.period } : {}),
			...(r.fileUrl ? { fileUrl: r.fileUrl } : {}),
			...(r.generatedAt ? { generatedAt: r.generatedAt.toISOString() } : {}),
			createdAt: r.createdAt.toISOString(),
		}));
	}

	static async getReportDownload(reportId: string) {
		const report = await db
			.select()
			.from(analyticsReports)
			.where(eq(analyticsReports.id, reportId))
			.limit(1);

		if (report.length === 0) return null;

		return report[0];
	}
}
