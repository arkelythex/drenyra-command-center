/**
 * W2-07B — Smoke tests del harness transversal
 *
 * Verifica que fixtures, helpers y contexto funcionan antes de
 * implementar los 9 escenarios de W2-07C.
 *
 * Obligatorio: todos pasan sin depender del orden de ejecución.
 */

import { NoopFailureProbe } from "@drenyra/persistence";
import {
	DeterministicFailureHarness,
	SimulatedProcessCrash,
} from "@drenyra/test-utils";
import { describe, expect, it } from "vitest";
import { OutboxRelay } from "../../../job-outbox-relay";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createJobFixture } from "../fixtures/jobs";
import { createMessageFixture } from "../fixtures/messages";
import { createTenantFixture } from "../fixtures/tenants";
import {
	blockAtStage,
	crash,
	createTwoContenderBarrier,
} from "../helpers/transaction-barriers";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

describe("Fixtures — determinismo e inmutabilidad", () => {
	it("createTenantFixture produce valores deterministas", () => {
		const a = createTenantFixture();
		const b = createTenantFixture();
		expect(a.tenantA).toEqual(b.tenantA);
		expect(a.tenantB).toEqual(b.tenantB);
	});

	it("fiscal operations son deterministas", () => {
		const t = createTenantFixture();
		const a = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const b = createFiscalOperationFixture(t.tenantA, t.tenantB);
		expect(a.invoiceA).toEqual(b.invoiceA);
		expect(a.invoiceACollision).toEqual(b.invoiceACollision);
	});

	it("messages son deterministas", () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const a = createMessageFixture(t.tenantA, f.invoiceA);
		const b = createMessageFixture(t.tenantA, f.invoiceA);
		expect(a.invoiceCreated.messageId).toBe(b.invoiceCreated.messageId);
		expect(a.invoiceCreated.payload).toEqual(b.invoiceCreated.payload);
	});

	it("jobs son deterministas", () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const a = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);
		const b = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);
		expect(a.sunatSubmit.logicalKey).toBe(b.sunatSubmit.logicalKey);
		expect(a.reportGenerate.uniquenessPolicy).toBe("REPLACEABLE");
		expect(a.csvBatch.uniquenessPolicy).toBe("ACTIVE_ONLY");
		expect(a.fiscalNightly.uniquenessPolicy).toBe("WINDOWED");
		expect(a.fiscalNightly.executionWindow).toBe("2026-07");
	});

	it("overrides funcionan", () => {
		const t = createTenantFixture({
			tenantA: { organizationId: "x", companyId: "y" },
		});
		expect(t.tenantA.organizationId).toBe("x");
		expect(t.tenantA.companyId).toBe("y");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. TransactionBarriers
// ═══════════════════════════════════════════════════════════════════════════

describe("TransactionBarriers — failpoints y barreras", () => {
	it("createTwoContenderBarrier funciona", () => {
		const barrier = createTwoContenderBarrier(500);
		expect(barrier).toBeDefined();
	});

	it("blockAtStage registra failpoint correctamente", () => {
		const harness = new DeterministicFailureHarness();
		const barrier = createTwoContenderBarrier(500);

		blockAtStage(harness, "test-block", "outbox.after-claim", barrier);
		expect(harness.list()).toContain("test-block");
	});

	it("crash produce SimulatedProcessCrash", async () => {
		const harness = new DeterministicFailureHarness();
		harness.inject("crash-test", crash());

		await expect(harness.hit("outbox.after-queue-add")).rejects.toThrow(
			SimulatedProcessCrash,
		);
	});

	it("NoopFailureProbe nunca altera el flujo", async () => {
		const probe = new NoopFailureProbe();
		await expect(probe.hit("runner.before-complete")).resolves.toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Database tests (requieren PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Wave2TestContext — smoke tests", () => {
	it("abre contexto, crea sesiones independientes, cierra", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx = await Wave2TestContext.create();
		try {
			const session = await ctx.createDatabaseSession();
			expect(session.db).toBeDefined();
			await session.close();
		} finally {
			await ctx.close();
		}
	});

	it("crea OutboxRelay desde contexto", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx = await Wave2TestContext.create();
		try {
			const { relay, queue } = ctx.createOutboxRelay();
			expect(relay).toBeInstanceOf(OutboxRelay);
			const result = await queue.add("test", {});
			expect(result.id).toContain("bull-test-");
		} finally {
			await ctx.close();
		}
	});

	it("activa failpoint desde contexto", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx = await Wave2TestContext.create();
		try {
			ctx.harness.inject(
				"smoke-crash",
				{
					kind: "crash",
				},
				{ stage: "outbox.after-queue-add" },
			);

			await expect(ctx.harness.hit("outbox.after-queue-add")).rejects.toThrow(
				SimulatedProcessCrash,
			);

			expect(ctx.harness.stats("smoke-crash")?.activations).toBe(1);
		} finally {
			await ctx.close();
		}
	});

	it("reset() limpia failpoints", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx = await Wave2TestContext.create();
		try {
			ctx.harness.inject("test-fp", { kind: "crash" });
			expect(ctx.harness.list().length).toBe(1);

			ctx.resetHarness();
			expect(ctx.harness.list().length).toBe(0);
		} finally {
			await ctx.close();
		}
	});

	it("dos tests pueden ejecutarse en distinto orden (testRunId único)", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx1 = await Wave2TestContext.create();
		const ctx2 = await Wave2TestContext.create();

		try {
			expect(ctx1.testRunId).not.toBe(ctx2.testRunId);
		} finally {
			await ctx1.close();
			await ctx2.close();
		}
	});

	it("TableStateReader funciona con repositorio", async () => {
		const { Wave2TestContext } = await import("../helpers/wave2-test-context");
		const ctx = await Wave2TestContext.create();
		try {
			// Crea una execution vía repositorio
			const t = createTenantFixture();
			const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
			const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

			const created = await ctx.repo.createOrResolve(
				ctx.tableReader.db,
				j.sunatSubmit,
			);
			expect(created.kind).toBe("created");

			if (created.kind === "created") {
				// Lee via TableStateReader
				const count = await ctx.tableReader.countJobExecutions(
					j.sunatSubmit.logicalKey,
				);
				expect(count).toBe(1);

				const exec = await ctx.tableReader.readJobExecutionStatus(
					j.sunatSubmit.logicalKey,
				);
				expect(exec?.status).toBe("PENDING");
			}
		} finally {
			await ctx.close();
		}
	});
});
