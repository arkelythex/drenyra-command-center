import { beforeEach, describe, expect, it } from "vitest";
import { useFiscalCaseStore } from "../fiscal-case-store";

const STORAGE_KEY = "codex-fiscal-case-state";

function readPersistedState() {
	const raw = localStorage.getItem(STORAGE_KEY);
	return raw ? JSON.parse(raw) : null;
}

describe("FiscalCaseStore", () => {
	beforeEach(() => {
		useFiscalCaseStore.setState({
			fiscalCases: [],
			activeFiscalCaseId: null,
		});
	});

	it("should create a fiscal case with generated ID", () => {
		useFiscalCaseStore.getState().createFiscalCase("Nuevo caso");
		const cases = useFiscalCaseStore.getState().fiscalCases;
		expect(cases).toHaveLength(1);
		expect(cases[0].title).toBe("Nuevo caso");
		expect(cases[0].id).toBeDefined();
		expect(cases[0].status).toBe("open");
		expect(cases[0].date).toBeDefined();
	});

	it("should prepend new case and set it as active", () => {
		useFiscalCaseStore.getState().createFiscalCase("First");
		useFiscalCaseStore.getState().createFiscalCase("Second");

		const cases = useFiscalCaseStore.getState().fiscalCases;
		expect(cases).toHaveLength(2);
		expect(cases[0].title).toBe("Second");
		expect(useFiscalCaseStore.getState().activeFiscalCaseId).toBe(cases[0].id);
	});

	it("should set active fiscal case", () => {
		useFiscalCaseStore.getState().createFiscalCase("Test");
		const caseId = useFiscalCaseStore.getState().fiscalCases[0].id;

		useFiscalCaseStore.getState().setActiveFiscalCase(null);
		expect(useFiscalCaseStore.getState().activeFiscalCaseId).toBeNull();

		useFiscalCaseStore.getState().setActiveFiscalCase(caseId);
		expect(useFiscalCaseStore.getState().activeFiscalCaseId).toBe(caseId);
	});

	it("should update fiscal case status", () => {
		useFiscalCaseStore.getState().createFiscalCase("Test");
		const caseId = useFiscalCaseStore.getState().fiscalCases[0].id;

		useFiscalCaseStore.getState().updateFiscalCaseStatus(caseId, "resolved");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe(
			"resolved",
		);

		useFiscalCaseStore.getState().updateFiscalCaseStatus(caseId, "in-review");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe(
			"in-review",
		);
	});

	it("should not modify other cases when updating status", () => {
		useFiscalCaseStore.getState().createFiscalCase("First");
		useFiscalCaseStore.getState().createFiscalCase("Second");
		const firstId = useFiscalCaseStore.getState().fiscalCases[1].id;

		useFiscalCaseStore.getState().updateFiscalCaseStatus(firstId, "resolved");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe("open");
		expect(useFiscalCaseStore.getState().fiscalCases[1].status).toBe(
			"resolved",
		);
	});

	it("should handle status transitions correctly", () => {
		useFiscalCaseStore.getState().createFiscalCase("Test");
		const caseId = useFiscalCaseStore.getState().fiscalCases[0].id;

		useFiscalCaseStore.getState().updateFiscalCaseStatus(caseId, "open");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe("open");

		useFiscalCaseStore.getState().updateFiscalCaseStatus(caseId, "in-review");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe(
			"in-review",
		);

		useFiscalCaseStore.getState().updateFiscalCaseStatus(caseId, "resolved");
		expect(useFiscalCaseStore.getState().fiscalCases[0].status).toBe(
			"resolved",
		);
	});

	it("should persist fiscalCases and activeFiscalCaseId to localStorage", () => {
		useFiscalCaseStore.getState().createFiscalCase("Persisted case");
		const persisted = readPersistedState();
		expect(persisted).not.toBeNull();
		expect(persisted.state.fiscalCases).toBeDefined();
		expect(persisted.state.fiscalCases.length).toBeGreaterThan(0);
		expect(persisted.state.activeFiscalCaseId).toBeDefined();
	});
});
