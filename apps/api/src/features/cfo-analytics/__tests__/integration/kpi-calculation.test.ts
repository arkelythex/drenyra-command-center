/**
 * Integration Test: CFO Analytics
 *
 * Tests the CFO Analytics pipeline:
 *   create dashboard → add widgets → generate reports → verify KPI data
 *
 * @module features/cfo-analytics/__tests__/integration
 */
import {
	analyticsDashboards,
	analyticsReports,
	analyticsWidgets,
} from "@drenyra/persistence/schema";
import { createTransactionHooks } from "@drenyra/test-utils/database";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";
import {
	TEST_COMPANY_ID,
	TEST_DASHBOARD_ID,
	TEST_OWNER_ID,
	TEST_REPORT_ID,
	TEST_WIDGET_ID,
} from "../../../shared/__tests__/integration/test-constants";

await loadApiEnv();

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("CFO Analytics (integration)", () => {
	const {
		beforeEach: setupTx,
		afterEach: teardownTx,
		getDb,
	} = createTransactionHooks();

	beforeEach(async () => {
		await setupTx();
		const db = getDb();

		// 1. Dashboard
		await db.insert(analyticsDashboards).values({
			id: TEST_DASHBOARD_ID,
			companyId: TEST_COMPANY_ID,
			name: "Panel CFO - Junio 2026",
			config: {
				widgets: [],
				layout: "grid",
			},
			createdById: TEST_OWNER_ID,
		});

		// 2. Widget
		await db.insert(analyticsWidgets).values({
			id: TEST_WIDGET_ID,
			dashboardId: TEST_DASHBOARD_ID,
			type: "kpi_card",
			config: {
				metrics: ["total_revenue", "total_expenses", "net_income"],
				filters: { period: "2026-06" },
				timeRange: "month",
				comparison: "previous_period",
			},
			size: "medium",
			position: { x: 0, y: 0 },
		});

		// 3. Report
		await db.insert(analyticsReports).values({
			id: TEST_REPORT_ID,
			companyId: TEST_COMPANY_ID,
			type: "financial",
			parameters: {
				period: "2026-06",
				includeComparison: true,
				format: "pdf",
			},
			status: "QUEUED",
			period: "2026-06",
			createdById: TEST_OWNER_ID,
		});
	});

	afterEach(async () => {
		await teardownTx();
	});

	it("should create dashboard with config", async () => {
		const db = getDb();

		const [dash] = await db
			.select()
			.from(analyticsDashboards)
			.where(eq(analyticsDashboards.id, TEST_DASHBOARD_ID));

		expect(dash).toBeDefined();
		expect(dash.name).toBe("Panel CFO - Junio 2026");
		expect(dash.companyId).toBe(TEST_COMPANY_ID);
		expect(dash.config.layout).toBe("grid");
		expect(dash.createdById).toBe(TEST_OWNER_ID);
	});

	it("should create widgets linked to a dashboard", async () => {
		const db = getDb();

		const [widget] = await db
			.select()
			.from(analyticsWidgets)
			.where(eq(analyticsWidgets.id, TEST_WIDGET_ID));

		expect(widget).toBeDefined();
		expect(widget.dashboardId).toBe(TEST_DASHBOARD_ID);
		expect(widget.type).toBe("kpi_card");
		expect(widget.config.metrics).toContain("total_revenue");
		expect(widget.config.timeRange).toBe("month");
		expect(widget.size).toBe("medium");
	});

	it("should transition report through status lifecycle", async () => {
		const db = getDb();

		// QUEUED → GENERATING
		await db
			.update(analyticsReports)
			.set({ status: "GENERATING" })
			.where(eq(analyticsReports.id, TEST_REPORT_ID));

		let [rpt] = await db
			.select()
			.from(analyticsReports)
			.where(eq(analyticsReports.id, TEST_REPORT_ID));
		expect(rpt.status).toBe("GENERATING");

		// GENERATING → READY
		await db
			.update(analyticsReports)
			.set({
				status: "READY",
				fileUrl: "https://storage.drenyra.com/reports/2026-06-financial.pdf",
				generatedAt: new Date(),
			})
			.where(eq(analyticsReports.id, TEST_REPORT_ID));

		[rpt] = await db
			.select()
			.from(analyticsReports)
			.where(eq(analyticsReports.id, TEST_REPORT_ID));
		expect(rpt.status).toBe("READY");
		expect(rpt.fileUrl).toBeTruthy();
		expect(rpt.generatedAt).toBeDefined();
	});

	it("should handle report FAILED status", async () => {
		const db = getDb();

		await db
			.update(analyticsReports)
			.set({
				status: "FAILED",
				fileUrl: null,
			})
			.where(eq(analyticsReports.id, TEST_REPORT_ID));

		const [rpt] = await db
			.select()
			.from(analyticsReports)
			.where(eq(analyticsReports.id, TEST_REPORT_ID));

		expect(rpt.status).toBe("FAILED");
		expect(rpt.fileUrl).toBeNull();
	});

	it("should cascade delete widgets when dashboard is removed", async () => {
		const db = getDb();

		await db
			.delete(analyticsDashboards)
			.where(eq(analyticsDashboards.id, TEST_DASHBOARD_ID));

		const widgets = await db
			.select()
			.from(analyticsWidgets)
			.where(eq(analyticsWidgets.dashboardId, TEST_DASHBOARD_ID));

		expect(widgets).toHaveLength(0);
	});
});
