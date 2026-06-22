import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DrenyraCommandCenter } from "./components/DrenyraCommandCenter";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children }: { to: string; children: ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "company-001",
			companyName: "Nebula Operaciones S.A.C.",
			ruc: "20608451231",
			countryCode: "PE",
			isDemoFallback: false,
		},
		availableCompanies: [
			{
				companyId: "company-001",
				companyName: "Nebula Operaciones S.A.C.",
				ruc: "20608451231",
				countryCode: "PE",
				isDemoFallback: false,
			},
		],
		setActiveCompanyById: vi.fn(),
	}),
}));

vi.mock("./components/command-capability-audit-panel", () => ({
	CommandCapabilityAuditPanel: () => <div>Capability audit</div>,
}));

const createCaseMock = vi.hoisted(() => vi.fn());
const addEvidenceMock = vi.hoisted(() => vi.fn());
const updateCaseStatusMock = vi.hoisted(() => vi.fn());
const approveMock = vi.hoisted(() => vi.fn());
const rejectMock = vi.hoisted(() => vi.fn());

vi.mock("./api/drenyra-command-center.api", () => ({
	drenyraCommandCenterApi: {
		listCases: vi.fn(async () => [
			{
				id: "case-1",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "MONTHLY_CLOSE",
				status: "APPROVAL_PENDING",
				title: "Cierre fiscal mayo",
				description: "Caso de cierre con evidencia",
				riskLevel: "MEDIUM",
				riskScore: 52,
				autonomyLevel: "PREPARE_WITH_APPROVAL",
				createdBy: "user-1",
				createdAt: "2026-05-19T00:00:00.000Z",
				updatedAt: "2026-05-19T00:00:00.000Z",
				metadata: {},
			},
		]),
		getCaseDetails: vi.fn(async () => ({
			case: {
				id: "case-1",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "MONTHLY_CLOSE",
				status: "APPROVAL_PENDING",
				title: "Cierre fiscal mayo",
				description: "Caso de cierre con evidencia",
				riskLevel: "MEDIUM",
				riskScore: 52,
				autonomyLevel: "PREPARE_WITH_APPROVAL",
				createdBy: "user-1",
				createdAt: "2026-05-19T00:00:00.000Z",
				updatedAt: "2026-05-19T00:00:00.000Z",
				metadata: {},
			},
			evidence: [
				{
					id: "ev-1",
					caseId: "case-1",
					type: "SUNAT_RECORD",
					title: "SIRE",
					summary: "Registro SIRE",
					source: "SUNAT",
					contentHash: "abc",
					createdAt: "2026-05-19T00:00:00.000Z",
				},
			],
			agentRuns: [],
			approvals: [
				{
					id: "ap-1",
					caseId: "case-1",
					status: "PENDING",
					title: "Aprobar preparación",
					description: "Preparar",
					autonomyLevel: "PREPARE_WITH_APPROVAL",
					requestedAt: "2026-05-19T00:00:00.000Z",
					diff: { before: {}, after: {}, summary: "Preparación" },
				},
				{
					id: "ap-2",
					caseId: "case-1",
					status: "APPROVED",
					title: "Aprobación SIRE previa",
					description: "Validar SIRE",
					autonomyLevel: "PREPARE_WITH_APPROVAL",
					requestedAt: "2026-05-18T00:00:00.000Z",
					decidedAt: "2026-05-18T01:00:00.000Z",
					decisionReason: "Evidencia SIRE validada",
					diff: { before: {}, after: {}, summary: "Validación previa" },
				},
			],
			auditEvents: [
				{
					id: "audit-1",
					eventType: "FISCAL_CASE_CREATED",
					actorId: "user-1",
					message: "Creado",
					occurredAt: "2026-05-19T00:00:00.000Z",
				},
			],
		})),
		createCase: createCaseMock,
		addEvidence: addEvidenceMock,
		updateCaseStatus: updateCaseStatusMock,
		startAgentRun: vi.fn(),
		requestApproval: vi.fn(),
		approve: approveMock,
		reject: rejectMock,
	},
}));

function renderDrenyraCommandCenter() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<DrenyraCommandCenter />
		</QueryClientProvider>,
	);
}

describe("DrenyraCommandCenter", () => {
	beforeEach(() => {
		createCaseMock.mockReset();
		addEvidenceMock.mockReset();
		updateCaseStatusMock.mockReset();
		approveMock.mockReset();
		rejectMock.mockReset();
		createCaseMock.mockResolvedValue({
			id: "case-created",
			scope: {
				companyId: "company-001",
				companyRuc: "20608451231",
				period: "2026-05",
				countryCode: "PE",
			},
			type: "SIRE_REVIEW",
			status: "OPEN",
			title: "Nuevo caso SIRE",
			description: "Revisar propuesta SIRE de junio",
			riskLevel: "HIGH",
			riskScore: 67,
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			createdBy: "user-1",
			createdAt: "2026-05-19T00:00:00.000Z",
			updatedAt: "2026-05-19T00:00:00.000Z",
			metadata: {},
		});
		addEvidenceMock.mockResolvedValue({
			id: "ev-created",
			caseId: "case-1",
			type: "DOCUMENT",
			title: "Sustento ventas",
			summary: "Documento de sustento para ventas del periodo",
			source: "ERP",
			sourceRef: "ERP-2026-05",
			contentHash: "def",
			createdAt: "2026-05-19T00:00:00.000Z",
		});
		updateCaseStatusMock.mockResolvedValue({
			id: "case-1",
			scope: {
				companyId: "company-001",
				companyRuc: "20608451231",
				period: "2026-05",
				countryCode: "PE",
			},
			type: "MONTHLY_CLOSE",
			status: "RESOLVED",
			title: "Cierre fiscal mayo",
			description: "Caso de cierre con evidencia",
			riskLevel: "MEDIUM",
			riskScore: 52,
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			createdBy: "user-1",
			createdAt: "2026-05-19T00:00:00.000Z",
			updatedAt: "2026-05-19T00:01:00.000Z",
			metadata: {},
		});
		approveMock.mockResolvedValue({
			id: "ap-1",
			caseId: "case-1",
			status: "APPROVED",
			title: "Aprobar preparación",
			description: "Preparar",
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			requestedAt: "2026-05-19T00:00:00.000Z",
			decidedAt: "2026-05-19T00:02:00.000Z",
			decisionReason: "Evidencia revisada",
			diff: { before: {}, after: {}, summary: "Preparación" },
		});
		rejectMock.mockResolvedValue({
			id: "ap-1",
			caseId: "case-1",
			status: "REJECTED",
			title: "Aprobar preparación",
			description: "Preparar",
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			requestedAt: "2026-05-19T00:00:00.000Z",
			decidedAt: "2026-05-19T00:02:00.000Z",
			decisionReason: "Falta sustento",
			diff: { before: {}, after: {}, summary: "Preparación" },
		});
	});

	it("renders fiscal cases, evidence and approval controls", async () => {
		renderDrenyraCommandCenter();

		expect(await screen.findByText("Cierre fiscal mayo")).toBeInTheDocument();
		expect(await screen.findByText("SIRE")).toBeInTheDocument();
		expect(await screen.findByText("Aprobar preparación")).toBeInTheDocument();
		expect(screen.getByText("Drenyra Chat Panel")).toBeInTheDocument();
	});

	it("creates a fiscal case from explicit form values", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		await user.type(screen.getByLabelText("Título"), "Nuevo caso SIRE");
		await user.selectOptions(
			screen.getByLabelText("Tipo fiscal"),
			"SIRE_REVIEW",
		);
		await user.type(
			screen.getByLabelText("Descripción fiscal"),
			"Revisar propuesta SIRE de junio con trazabilidad fiscal.",
		);
		await user.selectOptions(screen.getByLabelText("Riesgo"), "HIGH");
		await user.clear(screen.getByLabelText("Score"));
		await user.type(screen.getByLabelText("Score"), "67");
		await user.click(screen.getByRole("button", { name: /crear caso/i }));

		expect(createCaseMock).toHaveBeenCalledWith({
			type: "SIRE_REVIEW",
			title: "Nuevo caso SIRE",
			description: "Revisar propuesta SIRE de junio con trazabilidad fiscal.",
			riskLevel: "HIGH",
			riskScore: 67,
			autonomyLevel: "PREPARE_WITH_APPROVAL",
		});
	});

	it("announces validation errors before creating a fiscal case", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		await user.click(screen.getByRole("button", { name: /crear caso/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"El título debe tener al menos 3 caracteres.",
		);
		expect(createCaseMock).not.toHaveBeenCalled();
	});

	it("attaches evidence to the selected fiscal case from explicit form values", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		const evidenceForm = await screen.findByRole("form", {
			name: "Adjuntar evidencia fiscal",
		});
		await user.selectOptions(
			within(evidenceForm).getByLabelText("Tipo"),
			"DOCUMENT",
		);
		await user.type(
			within(evidenceForm).getByLabelText("Título"),
			"Sustento ventas",
		);
		await user.clear(within(evidenceForm).getByLabelText("Fuente"));
		await user.type(within(evidenceForm).getByLabelText("Fuente"), "ERP");
		await user.type(
			within(evidenceForm).getByLabelText("Referencia opcional"),
			"ERP-2026-05",
		);
		await user.type(
			within(evidenceForm).getByLabelText("Resumen"),
			"Documento de sustento para ventas del periodo.",
		);
		await user.click(
			within(evidenceForm).getByRole("button", { name: /adjuntar evidencia/i }),
		);

		expect(addEvidenceMock).toHaveBeenCalledWith("case-1", {
			type: "DOCUMENT",
			title: "Sustento ventas",
			summary: "Documento de sustento para ventas del periodo.",
			source: "ERP",
			sourceRef: "ERP-2026-05",
		});
	});

	it("announces validation errors before attaching evidence", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		const evidenceForm = await screen.findByRole("form", {
			name: "Adjuntar evidencia fiscal",
		});
		await user.click(
			within(evidenceForm).getByRole("button", { name: /adjuntar evidencia/i }),
		);

		expect(await within(evidenceForm).findByRole("alert")).toHaveTextContent(
			"El título de evidencia debe tener al menos 3 caracteres.",
		);
		expect(addEvidenceMock).not.toHaveBeenCalled();
	});

	it("updates fiscal case status with an audit reason", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		const statusForm = await screen.findByRole("form", {
			name: "Actualizar estado fiscal",
		});
		await user.selectOptions(
			within(statusForm).getByLabelText("Nuevo estado"),
			"RESOLVED",
		);
		await user.type(
			within(statusForm).getByLabelText("Motivo opcional"),
			"Evidencia lista para cierre",
		);
		await user.click(
			within(statusForm).getByRole("button", { name: /actualizar estado/i }),
		);

		expect(updateCaseStatusMock).toHaveBeenCalledWith("case-1", {
			status: "RESOLVED",
			reason: "Evidencia lista para cierre",
		});
	});

	it("shows server errors when status update fails", async () => {
		const user = userEvent.setup();
		updateCaseStatusMock.mockRejectedValueOnce(
			new Error("FISCAL_CASE_STATUS_UNCHANGED"),
		);
		renderDrenyraCommandCenter();

		const statusForm = await screen.findByRole("form", {
			name: "Actualizar estado fiscal",
		});
		await user.selectOptions(
			within(statusForm).getByLabelText("Nuevo estado"),
			"RESOLVED",
		);
		await user.click(
			within(statusForm).getByRole("button", { name: /actualizar estado/i }),
		);

		expect(await within(statusForm).findByRole("alert")).toHaveTextContent(
			"FISCAL_CASE_STATUS_UNCHANGED",
		);
	});

	it("shows server errors when evidence attachment fails", async () => {
		const user = userEvent.setup();
		addEvidenceMock.mockRejectedValueOnce(
			new Error("No se pudo adjuntar evidencia"),
		);
		renderDrenyraCommandCenter();

		const evidenceForm = await screen.findByRole("form", {
			name: "Adjuntar evidencia fiscal",
		});
		await user.type(
			within(evidenceForm).getByLabelText("Título"),
			"Sustento ventas",
		);
		await user.type(
			within(evidenceForm).getByLabelText("Resumen"),
			"Documento de sustento para ventas del periodo.",
		);
		await user.click(
			within(evidenceForm).getByRole("button", { name: /adjuntar evidencia/i }),
		);

		expect(await within(evidenceForm).findByRole("alert")).toHaveTextContent(
			"No se pudo adjuntar evidencia",
		);
	});

	it("sends custom approval decision reasons", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		await screen.findByText("Aprobar preparación");
		await user.type(
			screen.getByLabelText(/motivo de decisión para aprobar preparación/i),
			"Evidencia cruzada y validada para cierre",
		);
		await user.click(screen.getByRole("button", { name: /aprobar/i }));

		expect(approveMock).toHaveBeenCalledWith("ap-1", {
			decisionReason: "Evidencia cruzada y validada para cierre",
		});
		expect(rejectMock).not.toHaveBeenCalled();
	});

	it("requires an auditable approval decision reason", async () => {
		const user = userEvent.setup();
		renderDrenyraCommandCenter();

		await screen.findByText("Aprobar preparación");
		await user.click(screen.getByRole("button", { name: /rechazar/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Ingresá un motivo de decisión auditable",
		);
		expect(rejectMock).not.toHaveBeenCalled();
	});

	it("shows approval decision server errors", async () => {
		const user = userEvent.setup();
		approveMock.mockRejectedValueOnce(new Error("APPROVAL_ALREADY_DECIDED"));
		renderDrenyraCommandCenter();

		await screen.findByText("Aprobar preparación");
		await user.type(
			screen.getByLabelText(/motivo de decisión para aprobar preparación/i),
			"Evidencia validada por supervisor fiscal",
		);
		await user.click(screen.getByRole("button", { name: /aprobar/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"APPROVAL_ALREADY_DECIDED",
		);
	});

	it("shows decided approval history with decision reasons", async () => {
		renderDrenyraCommandCenter();

		expect(
			await screen.findByText("Aprobación SIRE previa"),
		).toBeInTheDocument();
		expect(screen.getByText("Evidencia SIRE validada")).toBeInTheDocument();
		expect(screen.getByText("Validación previa")).toBeInTheDocument();
	});
});
