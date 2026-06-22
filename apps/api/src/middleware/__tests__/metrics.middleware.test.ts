import { Elysia } from "elysia";
import { beforeEach, describe, expect, it } from "vitest";
import {
	metricsMiddleware,
	normalizeMetricsRoute,
	resetMetrics,
} from "../metrics.middleware";

describe("metrics middleware", () => {
	beforeEach(() => {
		resetMetrics();
	});

	it("bounds route labels for UUID, CUID2, nanoid, RUC-like and numeric segments", () => {
		expect(
			normalizeMetricsRoute(
				"/companies/20100070970/cases/clh3k8u9p0000a1b2c3d4e5f6/evidence/V1StGXR8_Z5jdHi6B-myT/42?debug=1",
			),
		).toBe("/companies/:ruc/cases/:id/evidence/:id/:id");
		expect(
			normalizeMetricsRoute(
				"/documents/doc-1700000000-abcd/550e8400-e29b-41d4-a716-446655440000",
			),
		).toBe("/documents/:docId/:id");
	});

	it("records thrown requests once with a bounded route label", async () => {
		const app = new Elysia()
			.use(metricsMiddleware)
			.get("/boom/:id", () => {
				throw new Error("boom");
			});

		const response = await app.handle(
			new Request("http://localhost/boom/clh3k8u9p0000a1b2c3d4e5f6"),
		);
		expect(response.status).toBe(500);

		const metricsResponse = await app.handle(new Request("http://localhost/metrics"));
		const metrics = await metricsResponse.text();

		expect(metrics).toContain(
			'arkelythex_api_http_requests_total{method="GET",route="/boom/:id",status_code="500"} 1',
		);
		expect(metrics).toContain(
			'arkelythex_api_http_errors_total{method="GET",route="/boom/:id",status_code="500",error_type="Error"} 1',
		);
		expect(metrics).not.toContain("clh3k8u9p0000a1b2c3d4e5f6");
	});
});
