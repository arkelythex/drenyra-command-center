import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Elysia } from 'elysia';

const runSireAuditWorkflowMock = vi.fn();

vi.mock('../../workflows/sire-audit.workflow', async () => {
	const actual = await vi.importActual<typeof import('../../workflows/sire-audit.workflow')>(
		'../../workflows/sire-audit.workflow',
	);
	return {
		...actual,
		runSireAuditWorkflow: runSireAuditWorkflowMock,
	};
});

function buildAuditUrl(overrides?: Record<string, string>): string {
	const query = new URLSearchParams({
		companyId: 'cmp-1',
		period: '2026-07',
		ruc: '20123456789',
		declaredIgvPen: '180',
		salesTotalPen: '1180',
		rvieRecords: '2',
		rceRecords: '1',
		pleSalesRecords: '2',
		plePurchaseRecords: '1',
		dryRun: 'true',
		...(overrides ?? {}),
	});

	return `http://localhost/api/ai-swarm/sire-audit-stream?${query.toString()}`;
}

describe('SIRE audit stream security hardening', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: 'test',
			SECURITY_ENFORCE_TEST_RBAC: 'true',
			SECURITY_ENFORCE_TEST_SESSION: 'false',
			DRENYRA_AES256_KEY: 'drenyra-test-key-for-aes-256-gcm',
		};

		runSireAuditWorkflowMock.mockImplementation(
			async (
				_input: unknown,
				onStep: (event: { step: string; status: string; data?: Record<string, unknown> }) => void,
			) => {
				onStep({ step: 'validation', status: 'completed', data: { checks: 3 } });
				return {
					companyId: 'cmp-1',
					period: '2026-07',
					overallStatus: 'ready',
					consensusScore: 0.95,
					anomalies: [],
					policy: { isDeferred: false, reason: 'allowed', postponedUntil: '2026-06-01' },
					pleSummary: {
						salesRecords: 2,
						purchaseRecords: 1,
						salesTotalPen: 1180,
						igvTotalPen: 180,
					},
					pleFiles: {
						ventas: { filename: 'LE20123456789202607RV.txt', recordCount: 2, bytes: 200 },
						compras: { filename: 'LE20123456789202607RC.txt', recordCount: 1, bytes: 140 },
					},
					submission: { attempted: false, skippedReason: 'dryRun=true' },
					executionMs: 120,
				};
			},
		);
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('rejects missing auth context headers', async () => {
		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(new Request(buildAuditUrl()));

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe('AUTH_REQUIRED');
	});

	it('denies viewer role via RBAC', async () => {
		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request(buildAuditUrl(), {
				headers: {
					'x-user-id': 'usr-viewer',
					'x-user-role': 'viewer',
					'x-company-id': 'cmp-1',
				},
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe('FORBIDDEN_ROLE');
	});

	it('blocks live submission for non-privileged role', async () => {
		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request(buildAuditUrl({ dryRun: 'false' }), {
				headers: {
					'x-user-id': 'usr-analyst',
					'x-user-role': 'analyst',
					'x-company-id': 'cmp-1',
				},
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe('FORBIDDEN_ROLE');
	});

	it('requires explicit admin override for live submission', async () => {
		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request(buildAuditUrl({ dryRun: 'false' }), {
				headers: {
					'x-user-id': 'usr-admin',
					'x-user-role': 'admin',
					'x-company-id': 'cmp-1',
				},
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe('ADMIN_OVERRIDE_REQUIRED');
	});

	it('returns encrypted SSE payloads when requested', async () => {
		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request(buildAuditUrl(), {
				headers: {
					'x-user-id': 'usr-admin',
					'x-user-role': 'admin',
					'x-company-id': 'cmp-1',
					'x-encrypted-events': 'true',
				},
			}),
		);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toContain('event: audit-started');
		expect(body).toContain('"encryptedEvents":true');
		expect(body).toContain('"__enc":"aes-256-gcm.v1"');
		expect(runSireAuditWorkflowMock).toHaveBeenCalledOnce();
	});

	it('fails fast when encryption is requested but key is missing', async () => {
		delete process.env.DRENYRA_AES256_KEY;

		const { sireAuditRoute } = await import('../../api/sire-audit.route');
		const app = new Elysia().use(sireAuditRoute);

		const response = await app.handle(
			new Request(buildAuditUrl(), {
				headers: {
					'x-user-id': 'usr-admin',
					'x-user-role': 'admin',
					'x-company-id': 'cmp-1',
					'x-encrypted-events': 'true',
				},
			}),
		);

		expect(response.status).toBe(503);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe('ENCRYPTION_KEY_MISSING');
	});
});
