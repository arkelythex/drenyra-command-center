import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHealthModule } from "../../index";

const mockDbExecute = vi.fn();
const mockLoggerInfo = vi.fn();
const mockGetBackupReadinessStatus = vi.fn();
const mockGetOpenTelemetryReadinessStatus = vi.fn();
const mockGetRlsReadinessStatus = vi.fn();
const mockGetTaxationEventBootstrapStatus = vi.fn();

describe("healthModule", () => {
	let app: Elysia;
	const originalEnv = { ...process.env };
	const requiredTables = [
		"auth_users",
		"auth_sessions",
		"bank_accounts",
		"bank_transactions",
	];

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			DATABASE_URL: "postgresql://user:password@localhost:5436/arkelythex",
			BETTER_AUTH_SECRET: "dev-secret-key-change-in-production-min-32-chars",
		};
		app = new Elysia().use(
			buildHealthModule({
				dbExecute: mockDbExecute,
				loggerInfo: mockLoggerInfo,
				getBackupReadinessStatus: mockGetBackupReadinessStatus,
				getOpenTelemetryReadinessStatus: mockGetOpenTelemetryReadinessStatus,
				getRlsReadinessStatus: mockGetRlsReadinessStatus,
				getTaxationEventBootstrapStatus: mockGetTaxationEventBootstrapStatus,
				fetchFn: vi.fn(async () => new Response(null, { status: 200 })),
			}),
		);
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("returns backup warning hints from /health/doctor without degrading status", async () => {
		mockDbExecute
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce({
				rows: requiredTables.map((table_name) => ({ table_name })),
			});
		mockGetBackupReadinessStatus.mockResolvedValue({
			status: "warning",
			backupDir: "/tmp/arkelythex-backups",
			thresholdHours: 24,
			lastBackupAt: "2026-03-01T00:00:00.000Z",
			lastBackupAgeHours: 30,
			latestArtifact: "/tmp/arkelythex-backups/arkelythex.dump",
			source: "manifest",
		});
		mockGetOpenTelemetryReadinessStatus.mockReturnValue({
			status: "ready",
			enabled: true,
			serviceName: "arkelythex-api",
			exporterEndpoint: "https://otlp.example.com/v1/traces",
			usingDefaultServiceName: false,
		});
		mockGetRlsReadinessStatus.mockResolvedValue({
			status: "staged",
			targetCount: 5,
			policyCount: 5,
			enabledCount: 0,
			missingPolicies: [],
			pendingEnablement: ["invoices", "bills"],
		});
		mockGetTaxationEventBootstrapStatus.mockReturnValue({ status: "ready" });

		const response = await app.handle(
			new Request("http://localhost/health/doctor"),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			status: "ok",
			checks: {
				database: { status: "ok" },
				tables: { status: "ok" },
				backups: {
					status: "warning",
					thresholdHours: 24,
				},
				otel: {
					status: "ready",
					serviceName: "arkelythex-api",
				},
				rls: {
					status: "staged",
				},
				taxationEvents: {
					status: "ready",
				},
			},
			hints: expect.arrayContaining([
				"PostgreSQL backup is older than 24h. Create a fresh backup before risky changes.",
				"Tenant RLS policies are staged for 5/5 tables but PostgreSQL RLS is still disabled on: invoices, bills",
			]),
		});
	});

	it("returns missing backup evidence hints from /health/doctor", async () => {
		mockDbExecute
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce({
				rows: requiredTables.map((table_name) => ({ table_name })),
			});
		mockGetBackupReadinessStatus.mockResolvedValue({
			status: "missing",
			backupDir: "/tmp/arkelythex-backups",
			thresholdHours: 24,
			lastBackupAt: null,
			lastBackupAgeHours: null,
			latestArtifact: null,
			source: "none",
		});
		mockGetOpenTelemetryReadinessStatus.mockReturnValue({
			status: "config_invalid",
			enabled: true,
			serviceName: "arkelythex-api",
			exporterEndpoint: null,
			usingDefaultServiceName: true,
		});
		mockGetRlsReadinessStatus.mockResolvedValue({
			status: "missing",
			targetCount: 5,
			policyCount: 0,
			enabledCount: 0,
			missingPolicies: [
				"invoices",
				"bills",
				"business_partners",
				"bank_accounts",
				"bank_transactions",
			],
			pendingEnablement: [],
		});
		mockGetTaxationEventBootstrapStatus.mockReturnValue({
			status: "not_configured",
		});

		const response = await app.handle(
			new Request("http://localhost/health/doctor"),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			status: "ok",
			checks: {
				backups: {
					status: "missing",
				},
				otel: {
					status: "config_invalid",
				},
				rls: {
					status: "missing",
				},
				taxationEvents: {
					status: "not_configured",
				},
			},
			hints: expect.arrayContaining([
				"No PostgreSQL backup evidence found. Run: `bun run ops:db:backup` and verify with `bun run ops:db:restore:verify -- <dump>`",
				"OpenTelemetry is enabled but OTEL_EXPORTER_OTLP_ENDPOINT is missing. Configure an OTLP endpoint before relying on traces.",
				"Tenant RLS policies have not been staged yet. Apply the next RLS migration before enabling row-level security.",
				"NATS_URL is not configured. Taxation retention event subscriptions are skipped and event-driven observability remains disabled.",
			]),
		});
	});

	it("returns taxation event bootstrap status from /health/startup", async () => {
		mockDbExecute.mockResolvedValueOnce([]);
		mockGetTaxationEventBootstrapStatus.mockReturnValue({
			status: "disabled",
			error: "nats offline",
		});

		const response = await app.handle(
			new Request("http://localhost/health/startup"),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			status: "started",
			taxationEvents: {
				status: "disabled",
				error: "nats offline",
			},
		});
	});
});
