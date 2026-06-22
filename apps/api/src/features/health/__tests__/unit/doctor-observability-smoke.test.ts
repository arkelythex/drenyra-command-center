import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHealthModule } from "../../index";

const requiredTables = [
	"auth_users",
	"auth_sessions",
	"bank_accounts",
	"bank_transactions",
];

describe("/health/doctor observability smoke", () => {
	const originalEnv = { ...process.env };
	const mockDbExecute = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			ARKELYTHEX_ENABLE_OTEL: "1",
			OTEL_SERVICE_NAME: "arkelythex-api-local-smoke",
			OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318/v1/traces",
			DATABASE_URL: "postgresql://local-smoke:local-smoke@localhost:5436/arkelythex",
			BETTER_AUTH_SECRET: "local-smoke-secret-with-at-least-32-chars",
		};
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("reports local OTEL readiness through /health/doctor without exposing secrets", async () => {
		mockDbExecute
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce({
				rows: requiredTables.map((table_name) => ({ table_name })),
			});

		const app = new Elysia().use(
			buildHealthModule({
				dbExecute: mockDbExecute,
				loggerInfo: vi.fn(),
				getBackupReadinessStatus: async () => ({
					status: "ok",
					backupDir: "/tmp/arkelythex-backups",
					thresholdHours: 24,
					lastBackupAt: "2026-05-17T00:00:00.000Z",
					lastBackupAgeHours: 1,
					latestArtifact: "/tmp/arkelythex-backups/arkelythex.dump",
					source: "manifest",
				}),
				getRlsReadinessStatus: async () => ({
					status: "ready",
					targetCount: 5,
					policyCount: 5,
					enabledCount: 5,
					missingPolicies: [],
					pendingEnablement: [],
				}),
				getTaxationEventBootstrapStatus: () => ({ status: "ready" }),
				fetchFn: vi.fn(async () => new Response(null, { status: 200 })),
			}),
		);

		const response = await app.handle(
			new Request("http://localhost/health/doctor"),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();

		expect(payload).toMatchObject({
			status: "ok",
			env: {
				DATABASE_URL_SET: true,
				BETTER_AUTH_SECRET_LEN: process.env.BETTER_AUTH_SECRET?.length,
			},
			checks: {
				database: { status: "ok" },
				tables: { status: "ok", missing: [] },
				otel: {
					status: "ready",
					enabled: true,
					serviceName: "arkelythex-api-local-smoke",
					exporterEndpoint: "http://localhost:4318/v1/traces",
					usingDefaultServiceName: false,
				},
				backups: { status: "ok" },
				rls: { status: "ready" },
				taxationEvents: { status: "ready" },
			},
		});
		expect(JSON.stringify(payload)).not.toContain(process.env.DATABASE_URL);
		expect(JSON.stringify(payload)).not.toContain(process.env.BETTER_AUTH_SECRET);
		expect(payload.hints).not.toContain(
			"OpenTelemetry is disabled. Set ARKELYTHEX_ENABLE_OTEL=true and OTEL_EXPORTER_OTLP_ENDPOINT to enable production tracing.",
		);
		expect(payload.hints).not.toContain(
			"OpenTelemetry is enabled but OTEL_EXPORTER_OTLP_ENDPOINT is missing. Configure an OTLP endpoint before relying on traces.",
		);
	});
});
