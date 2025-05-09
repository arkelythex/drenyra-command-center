/**
 * Wave2TestContext — Contexto de pruebas transversal para Wave 2.
 *
 * Controla:
 *   - PostgreSQL y sesiones independientes
 *   - Factories de repositorios y servicios reales
 *   - DeterministicFailureHarness
 *   - TableStateReader y CrossLayerAssertions
 *   - Limpieza entre tests
 *   - Shutdown de conexiones
 *
 * No es un service locator. Las factories son explícitas y tipadas.
 * No usa mocks en la ruta transversal.
 */

import { randomUUID } from "node:crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { TestDatabase } from "@drenyra/test-utils/database";
import { DeterministicFailureHarness } from "@drenyra/test-utils";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { OutboxRelay } from "../../../job-outbox-relay";
import { JobRunner } from "../../../job-runner";
import { RecoverySweep } from "../../../job-recovery";
import { ReconciliationSweep } from "../../../job-reconciliation";
import type { FailureProbe } from "@drenyra/persistence";
import { TableStateReader } from "./table-state-reader";
import { CrossLayerAssertions } from "./cross-layer-assertions";

// ─── Database session ───────────────────────────────────────────────────────

export interface DatabaseSession {
	db: PostgresJsDatabase;
	/** Rollback al cerrar */
	close(): Promise<void>;
}

// ─── Mock queue ─────────────────────────────────────────────────────────────

export interface MockQueue {
	add: (name: string, data: unknown, opts?: unknown) => Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════

export class Wave2TestContext {
	readonly testRunId: string;
	readonly harness: DeterministicFailureHarness;
	readonly tableReader: TableStateReader;
	readonly assertions: CrossLayerAssertions;
	readonly repo: PostgresJobExecutionRepository;

	private readonly mainDb: PostgresJsDatabase;
	private readonly sessions: DatabaseSession[] = [];
	private isClosed = false;

	private constructor(db: PostgresJsDatabase) {
		this.testRunId = `w2-${randomUUID().slice(0, 8)}`;
		this.harness = new DeterministicFailureHarness();
		this.repo = new PostgresJobExecutionRepository();
		this.mainDb = db;
		this.tableReader = new TableStateReader(db);
		this.assertions = new CrossLayerAssertions(this.tableReader);
	}

	// ─── Factory ───────────────────────────────────────────────────────

	/**
	 * Creates a new context connected to the real test database.
	 * Uses DATABASE_URL_TEST or DATABASE_URL.
	 */
	static async create(url?: string): Promise<Wave2TestContext> {
		const databaseUrl =
			url || process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error(
				"DATABASE_URL_TEST or DATABASE_URL required for Wave2TestContext",
			);
		}

		const testDb = new TestDatabase(databaseUrl);
		await testDb.setup();
		const db = await testDb.beginTransaction();

		const ctx = new Wave2TestContext(db);

		// Store the testDB for cleanup
		(ctx as unknown as Record<string, unknown>)._testDb = testDb;

		return ctx;
	}

	// ─── Sessions ──────────────────────────────────────────────────────

	/**
	 * Creates an independent database session (new connection + transaction).
	 * Used for concurrent access scenarios.
	 */
	async createDatabaseSession(): Promise<DatabaseSession> {
		const databaseUrl =
			process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
		if (!databaseUrl) throw new Error("No database URL configured");

		const client = (await import("postgres")).default(databaseUrl, {
			max: 1,
			idle_timeout: 2,
			connect_timeout: 5,
		});
		const { drizzle } = await import("drizzle-orm/postgres-js");
		const db = drizzle(client);

		await client`BEGIN`;

		const session: DatabaseSession = {
			db,
			close: async () => {
				try {
					await client`ROLLBACK`;
				} catch {
					/* ignore */
				}
				await client.end().catch(() => {});
			},
		};

		this.sessions.push(session);
		return session;
	}

	// ─── Component factories ──────────────────────────────────────────

	createOutboxRelay(deps?: {
		failureProbe?: FailureProbe;
		metrics?: unknown;
		logger?: unknown;
	}): {
		relay: OutboxRelay;
		queue: {
			add: (
				name: string,
				data: unknown,
				opts?: unknown,
			) => Promise<{ id: string }>;
		};
	} {
		let callCount = 0;
		const queue = {
			add: async (_name: string, _data: unknown, _opts?: unknown) => {
				callCount++;
				return { id: `bull-test-${this.testRunId}-${callCount}` };
			},
		};

		const relay = new OutboxRelay(
			{ queue: queue as never },
			{
				failureProbe: deps?.failureProbe ?? this.harness,
			},
		);

		return { relay, queue };
	}

	createJobRunner(deps?: { failureProbe?: FailureProbe }): JobRunner {
		return new JobRunner(
			{ db: this.mainDb, defaultLeaseDurationMs: 60_000 },
			{ failureProbe: deps?.failureProbe ?? this.harness },
		);
	}

	createRecoverySweep(): RecoverySweep {
		return new RecoverySweep(this.mainDb, 50, {
			failureProbe: this.harness,
		});
	}

	createReconciliationSweep(): ReconciliationSweep {
		return new ReconciliationSweep(this.mainDb, {
			failureProbe: this.harness,
		});
	}

	// ─── Harness reset ────────────────────────────────────────────────

	resetHarness(): void {
		this.harness.reset();
	}

	// ─── Cleanup ──────────────────────────────────────────────────────

	/**
	 * Cierra todas las sesiones y la conexión principal.
	 * Rollback de todas las transacciones.
	 */
	async close(): Promise<void> {
		if (this.isClosed) return;
		this.isClosed = true;

		// Close independent sessions
		for (const session of this.sessions) {
			await session.close().catch(() => {});
		}
		this.sessions.length = 0;

		// Close main connection (rollback via testDb)
		const testDb = (this as unknown as Record<string, unknown>)._testDb as
			| {
					rollbackTransaction: () => Promise<void>;
					teardown: () => Promise<void>;
			  }
			| undefined;
		if (testDb) {
			try {
				await testDb.rollbackTransaction();
			} catch {
				/* ignore */
			}
			try {
				await testDb.teardown();
			} catch {
				/* ignore */
			}
		}
	}

	async reset(): Promise<void> {
		this.harness.reset();
		// Rollback and restart main transaction
		const testDb = (this as unknown as Record<string, unknown>)._testDb as
			| {
					rollbackTransaction: () => Promise<void>;
					beginTransaction: () => Promise<PostgresJsDatabase>;
			  }
			| undefined;
		if (testDb) {
			try {
				await testDb.rollbackTransaction();
			} catch {
				/* ignore */
			}
			const freshDb = await testDb.beginTransaction();
			(this as unknown as Record<string, PostgresJsDatabase>)._mainDb = freshDb;
			(this as { tableReader: TableStateReader }).tableReader =
				new TableStateReader(freshDb);
			(this as { assertions: CrossLayerAssertions }).assertions =
				new CrossLayerAssertions(this.tableReader);
		}
	}
}
