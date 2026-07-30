import { describe, it, expect } from "vitest";
import {
	createExecutionReference,
	createExecutionId,
	createExecutionRuntimeBinding,
} from "../execution";

describe("createExecutionReference", () => {
	it("should create an ExecutionReference with executionId and initial sequence", () => {
		const ref = createExecutionReference();

		expect(ref.executionId).toBeDefined();
		expect(typeof ref.executionId).toBe("string");
		expect(ref.executionId.length).toBeGreaterThan(0);
		expect(ref.lastAuthoritativeSequence).toBe(0);
		// No runtime bindings in the core reference
		expect("runtimeSessionId" in ref).toBe(false);
		expect("workflowId" in ref).toBe(false);
	});

	it("should generate unique ExecutionIds", () => {
		const ref1 = createExecutionReference();
		const ref2 = createExecutionReference();
		expect(ref1.executionId).not.toBe(ref2.executionId);
	});

	it("should start lastAuthoritativeSequence at 0", () => {
		const ref = createExecutionReference();
		expect(ref.lastAuthoritativeSequence).toBe(0);
	});
});

describe("createExecutionId", () => {
	it("should produce unique IDs", () => {
		const id1 = createExecutionId();
		const id2 = createExecutionId();
		expect(id1).not.toBe(id2);
		expect(id1.length).toBeGreaterThan(0);
	});
});

describe("createExecutionRuntimeBinding", () => {
	it("should create a binding linking execution to a runtime", () => {
		const execId = createExecutionId();
		const binding = createExecutionRuntimeBinding(
			execId,
			"pi",
			"pi-session-abc",
		);

		expect(binding.executionId).toBe(execId);
		expect(binding.runtime).toBe("pi");
		expect(binding.runtimeReference).toBe("pi-session-abc");
		expect(binding.bindingVersion).toBe(1);
	});

	it("should accept all runtime types", () => {
		const execId = createExecutionId();
		const runtimes = ["pi", "workflow", "worker", "connector"] as const;

		for (const runtime of runtimes) {
			const binding = createExecutionRuntimeBinding(
				execId,
				runtime,
				`ref-${runtime}`,
			);
			expect(binding.runtime).toBe(runtime);
		}
	});

	it("should keep execution identity stable across binding changes", () => {
		const execId = createExecutionId();

		const binding1 = createExecutionRuntimeBinding(
			execId,
			"pi",
			"pi-session-abc",
		);
		const binding2 = createExecutionRuntimeBinding(
			execId,
			"workflow",
			"temporal-wf-123",
		);

		// Execution identity is the same
		expect(binding1.executionId).toBe(execId);
		expect(binding2.executionId).toBe(execId);
		// But runtime references changed
		expect(binding1.runtimeReference).not.toBe(binding2.runtimeReference);
		expect(binding1.runtime).not.toBe(binding2.runtime);
	});
});
