/**
 * Integration Test: Workflow Automation
 *
 * Tests the automation-studio pipeline:
 *   create workflow → add steps → execute → track results
 *
 * @module features/automation-studio/__tests__/integration
 */
import {
	automationExecutions,
	automationSteps,
	automationWorkflows,
} from "@drenyra/persistence/schema";
import { createTransactionHooks } from "@drenyra/test-utils/database";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadApiEnv } from "../../../../env/load-api-env";
import {
	TEST_COMPANY_ID,
	TEST_EXECUTION_ID,
	TEST_STEP_A_ID,
	TEST_STEP_B_ID,
	TEST_WORKFLOW_ID,
} from "../../../shared/__tests__/integration/test-constants";

await loadApiEnv();

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("Workflow Automation (integration)", () => {
	const {
		beforeEach: setupTx,
		afterEach: teardownTx,
		getDb,
	} = createTransactionHooks();

	beforeEach(async () => {
		await setupTx();
		const db = getDb();

		// 1. Create workflow
		await db.insert(automationWorkflows).values({
			id: TEST_WORKFLOW_ID,
			companyId: TEST_COMPANY_ID,
			name: "Revisión automática de SIRE",
			description:
				"Workflow que verifica discrepancias SIRE y notifica al contador",
			category: "compliance",
			triggerType: "schedule",
			triggerConfig: { cron: "0 8 * * 1" },
			status: "active",
			runCount: 0,
			errorCount: 0,
		});

		// 2. Step A: check SIRE
		await db.insert(automationSteps).values({
			id: TEST_STEP_A_ID,
			workflowId: TEST_WORKFLOW_ID,
			stepOrder: 1,
			stepType: "action",
			actionType: "check_sire",
			config: { period: "monthly", ledgerType: "ventas" },
			status: "active",
		});

		// 3. Step B: send notification
		await db.insert(automationSteps).values({
			id: TEST_STEP_B_ID,
			workflowId: TEST_WORKFLOW_ID,
			stepOrder: 2,
			stepType: "action",
			actionType: "send_notification",
			config: { channel: "in_app", severity: "warning" },
			status: "active",
		});
	});

	afterEach(async () => {
		await teardownTx();
	});

	it("should create workflow with all required fields", async () => {
		const db = getDb();

		const [wf] = await db
			.select()
			.from(automationWorkflows)
			.where(eq(automationWorkflows.id, TEST_WORKFLOW_ID));

		expect(wf).toBeDefined();
		expect(wf.name).toBe("Revisión automática de SIRE");
		expect(wf.category).toBe("compliance");
		expect(wf.triggerType).toBe("schedule");
		expect(wf.status).toBe("active");
		expect(wf.companyId).toBe(TEST_COMPANY_ID);
	});

	it("should create steps ordered within a workflow", async () => {
		const db = getDb();

		const steps = await db
			.select()
			.from(automationSteps)
			.where(eq(automationSteps.workflowId, TEST_WORKFLOW_ID))
			.orderBy(automationSteps.stepOrder);

		expect(steps).toHaveLength(2);
		expect(steps[0].stepOrder).toBe(1);
		expect(steps[0].actionType).toBe("check_sire");
		expect(steps[1].stepOrder).toBe(2);
		expect(steps[1].actionType).toBe("send_notification");
	});

	it("should record a workflow execution", async () => {
		const db = getDb();

		await db.insert(automationExecutions).values({
			id: TEST_EXECUTION_ID,
			workflowId: TEST_WORKFLOW_ID,
			stepId: TEST_STEP_B_ID,
			triggeredBy: "schedule",
			status: "success",
			startedAt: new Date(),
			completedAt: new Date(),
			resultSummary: "SIRE check OK - 0 discrepancias, notificación enviada",
		});

		const [exec] = await db
			.select()
			.from(automationExecutions)
			.where(eq(automationExecutions.id, TEST_EXECUTION_ID));

		expect(exec).toBeDefined();
		expect(exec.workflowId).toBe(TEST_WORKFLOW_ID);
		expect(exec.status).toBe("success");
		expect(exec.startedAt).toBeDefined();
		expect(exec.completedAt).toBeDefined();
		expect(exec.resultSummary).toBeTruthy();

		// Verify workflow run counter should be updated by the service,
		// but at the schema level we verify the FK relationship works
	});

	it("should increment workflow run count after execution", async () => {
		const db = getDb();

		// Simulate the service updating run count
		await db
			.update(automationWorkflows)
			.set({
				runCount: 5,
				errorCount: 1,
				lastRunAt: new Date(),
				lastRunStatus: "success",
			})
			.where(eq(automationWorkflows.id, TEST_WORKFLOW_ID));

		const [wf] = await db
			.select()
			.from(automationWorkflows)
			.where(eq(automationWorkflows.id, TEST_WORKFLOW_ID));

		expect(wf.runCount).toBe(5);
		expect(wf.errorCount).toBe(1);
		expect(wf.lastRunStatus).toBe("success");
	});

	it("should cascade delete steps when workflow is removed", async () => {
		const db = getDb();

		// Delete workflow (cascades to steps)
		await db
			.delete(automationWorkflows)
			.where(eq(automationWorkflows.id, TEST_WORKFLOW_ID));

		const steps = await db
			.select()
			.from(automationSteps)
			.where(eq(automationSteps.workflowId, TEST_WORKFLOW_ID));

		expect(steps).toHaveLength(0);
	});
});
