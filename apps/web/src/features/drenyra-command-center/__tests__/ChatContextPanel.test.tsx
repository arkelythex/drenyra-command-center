/**
 * ChatContextPanel — Pruebas unitarias
 *
 * Cobertura total:
 *   1. idle   → texto de ayuda + badges de artifact types
 *   2. streaming → animación de pasos del swarm
 *   3. artifact + sheet_diff     → resumen filas/actualizadas/flagged
 *   4. artifact + accounting_diff → diff contable con scope y cambios
 *   5. artifact + dashboard       → primaryMetric + statusScore
 *   6. artifact + chart           → barras con data points
 *   7. case + caseDetails         → métricas, badge de riesgo, aprobaciones
 *   8. pinnedArtifacts            → conteo + título/resumen de cada uno
 *   9. Transición                 → wrapper transition-all + key={context}
 *  10. Fade en streaming          → clase animate-in/fade-in
 *
 * @see ChatContextPanel
 * @since Jun 2026
 */

// ---------------------------------------------------------------------------
// Mocks — deben estar al nivel del módulo (vi.mock hoisting)
// ---------------------------------------------------------------------------

vi.mock("@/features/drenyra-command-center/i18n/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"context.streaming.title": "Procesando...",
				"context.pinned": "Fijados",
			};
			return translations[key] || key;
		},
		i18n: { language: "es" },
	}),
}));

vi.mock(
	"@/features/cognitive-hub/components/artifacts/ArtifactRenderer",
	() => ({
		ArtifactRenderer: ({
			artifact,
		}: {
			artifact: { type: string; title: string };
		}) => <div data-testid="artifact-renderer">Rendered: {artifact.type}</div>,
	}),
);

vi.mock("@/lib/utils", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		AlertTriangle: icon("AlertTriangle"),
		BarChart3: icon("BarChart3"),
		Bot: icon("Bot"),
		CheckCircle2: icon("CheckCircle2"),
		Clock: icon("Clock"),
		FileText: icon("FileText"),
		Loader2: icon("Loader2"),
		MessageSquare: icon("MessageSquare"),
		PieChart: icon("PieChart"),
		Pin: icon("Pin"),
		ShieldAlert: icon("ShieldAlert"),
		Table: icon("Table"),
		XCircle: icon("XCircle"),
	};
});

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";
import type { FiscalCaseDetails } from "@/features/drenyra-command-center/api/drenyra-command-center.api";
import {
	ChatContextPanel,
	type ChatContextPanelProps,
} from "@/features/drenyra-command-center/components/ChatContextPanel";

// ---------------------------------------------------------------------------
// Helper factories — datos de prueba tipados
// ---------------------------------------------------------------------------

function sheetDiffArtifact(): HubArtifact {
	return {
		id: "art-sheet-1",
		title: "Conciliación bancaria",
		type: "sheet_diff",
		payload: {
			command: "reconcile",
			sourceName: "Ledger vs Bank",
			acceptShortcut: "a",
			rows: [
				{
					id: "r1",
					record: "R1",
					original: "100",
					corrected: "100",
					status: "updated",
					reason: "Match",
				},
			],
			summary: { total: 42, updated: 8, flagged: 3 },
		},
	} as HubArtifact;
}

function accountingDiffArtifact(): HubArtifact {
	return {
		id: "art-acct-1",
		title: "Diff contable mayo",
		type: "accounting_diff",
		payload: {
			command: "compare-periods",
			scope: "Mayo 2026",
			diffs: [
				{ field: "ingresos", before: "1000", after: "1200" },
				{ field: "gastos", before: "800", after: "750" },
			],
			summary: "2 cambios en ingresos y gastos",
		},
	} as HubArtifact;
}

function dashboardArtifact(): HubArtifact {
	return {
		id: "art-dash-1",
		title: "Dashboard fiscal",
		type: "dashboard",
		payload: {
			primaryMetric: { value: "S/ 12,450", trend: "+8.3% vs mes anterior" },
			statusScore: 73,
		},
	} as HubArtifact;
}

function chartArtifact(): HubArtifact {
	return {
		id: "art-chart-1",
		title: "Evolución IGV",
		type: "chart",
		payload: {
			data: [30, 45, 20, 60, 55, 70, 40, 50],
			labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"],
		},
	} as HubArtifact;
}

function explanationArtifact(): HubArtifact {
	return {
		id: "art-explain-1",
		title: "Análisis de variación",
		type: "explanation",
		content:
			"La variación en ingresos se debe a un ajuste estacional en el sector construcción. Se recomienda revisar las partidas contables asociadas.",
	} as HubArtifact;
}

function fiscalCaseDetails(
	overrides?: Partial<FiscalCaseDetails>,
): FiscalCaseDetails {
	return {
		case: {
			id: "case-001",
			scope: {
				companyId: "company-001",
				companyRuc: "20608451231",
				period: "2026-05",
				countryCode: "PE",
			},
			type: "MONTHLY_CLOSE",
			status: "OPEN",
			title: "Cierre fiscal mayo 2026",
			description: "Revisión integral de cierre mensual",
			riskLevel: "HIGH",
			riskScore: 68,
			autonomyLevel: "PREPARE_WITH_APPROVAL",
			createdBy: "user-001",
			createdAt: "2026-05-19T00:00:00.000Z",
			updatedAt: "2026-05-19T00:00:00.000Z",
			metadata: {},
		},
		evidence: [
			{
				id: "ev-1",
				caseId: "case-001",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "DOCUMENT",
				title: "Balance mensual",
				summary: "Balance de comprobación mayo 2026",
				source: "ERP",
				contentHash: "abc123",
				addedBy: "user-001",
				createdAt: "2026-05-19T00:00:00.000Z",
				metadata: {},
			},
			{
				id: "ev-2",
				caseId: "case-001",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "LEDGER_ENTRY",
				title: "Asiento de ajuste",
				summary: "Ajuste por diferencia de cambio",
				source: "ERP",
				contentHash: "def456",
				addedBy: "system",
				createdAt: "2026-05-19T00:00:00.000Z",
				metadata: {},
			},
		],
		agentRuns: [
			{
				id: "run-1",
				caseId: "case-001",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				agentType: "LEDGER_AGENT",
				status: "COMPLETED",
				startedBy: "user-001",
				startedAt: "2026-05-19T00:00:00.000Z",
				completedAt: "2026-05-19T00:05:00.000Z",
				metadata: {},
			},
			{
				id: "run-2",
				caseId: "case-001",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				agentType: "SIRE_AGENT",
				status: "COMPLETED",
				startedBy: "user-001",
				startedAt: "2026-05-19T00:06:00.000Z",
				metadata: {},
			},
			{
				id: "run-3",
				caseId: "case-001",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				agentType: "CONCILIATION_AGENT",
				status: "STARTED",
				startedBy: "user-001",
				startedAt: "2026-05-19T00:10:00.000Z",
				metadata: {},
			},
		],
		approvals: [],
		auditEvents: [
			{
				id: "ae-1",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				eventType: "FISCAL_CASE_CREATED",
				actorId: "user-001",
				message: "Caso creado por usuario",
				occurredAt: "2026-05-19T00:00:00.000Z",
				metadata: {},
			},
			{
				id: "ae-2",
				scope: {
					companyId: "company-001",
					companyRuc: "20608451231",
					period: "2026-05",
					countryCode: "PE",
				},
				eventType: "EVIDENCE_ADDED",
				actorId: "system",
				message: "Evidencia adjuntada automáticamente",
				occurredAt: "2026-05-19T00:01:00.000Z",
				metadata: {},
			},
		],
		...overrides,
	} as FiscalCaseDetails;
}

// ---------------------------------------------------------------------------
// Valores por defecto para las props
// ---------------------------------------------------------------------------

const defaultProps: ChatContextPanelProps = {
	context: "idle",
	activeArtifact: null,
	caseDetails: null,
	pendingApprovalsCount: 0,
	isStreaming: false,
	pinnedArtifacts: [],
};

// ===========================================================================
// Tests
// ===========================================================================

describe("ChatContextPanel", () => {
	// ─── context: idle ─────────────────────────────────────────────────

	describe('context="idle"', () => {
		it("muestra el título de la sección de contexto", () => {
			render(<ChatContextPanel {...defaultProps} />);
			expect(screen.getByText("Contexto del chat")).toBeInTheDocument();
		});

		it("muestra el texto de ayuda contextual", () => {
			render(<ChatContextPanel {...defaultProps} />);
			expect(
				screen.getByText(/El panel derecho muestra previews contextuales/),
			).toBeInTheDocument();
		});

		it("muestra badges con los artifact types disponibles", () => {
			render(<ChatContextPanel {...defaultProps} />);
			expect(screen.getByText("sheet_diff")).toBeInTheDocument();
			expect(screen.getByText("chart")).toBeInTheDocument();
			expect(screen.getByText("dashboard")).toBeInTheDocument();
		});

		it("no muestra métricas de caso ni pasos del swarm", () => {
			render(<ChatContextPanel {...defaultProps} />);
			expect(screen.queryByText(/agente trabajando/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/evidencias/i)).not.toBeInTheDocument();
		});
	});

	// ─── context: streaming ────────────────────────────────────────────

	describe('context="streaming"', () => {
		it("muestra 'Agente trabajando' con Loader2 animado", () => {
			render(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			expect(screen.getByText("Agente trabajando")).toBeInTheDocument();
			expect(
				screen.getAllByTestId("lucide-Loader2").length,
			).toBeGreaterThanOrEqual(3);
		});

		it("muestra los 3 pasos del swarm (Analizando, Consultando, Generando)", () => {
			render(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			expect(screen.getByText("Analizando datos...")).toBeInTheDocument();
			expect(screen.getByText("Consultando ledger...")).toBeInTheDocument();
			expect(screen.getByText("Generando propuesta...")).toBeInTheDocument();
		});

		it("aplica clase fade-in animate-in para la animación de entrada", () => {
			const { container } = render(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			const fadeWrapper = container.querySelector(".animate-in.fade-in");
			expect(fadeWrapper).toBeInTheDocument();
			expect(fadeWrapper).toHaveClass("duration-500");
		});

		it("muestra el header 'Procesando...' cuando isStreaming es true", () => {
			render(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			expect(screen.getByText("Procesando...")).toBeInTheDocument();
		});
	});

	// ─── context: artifact + sheet_diff ────────────────────────────────

	describe('context="artifact" — sheet_diff', () => {
		it("muestra el título 'Diff de conciliación' con icono Table", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={sheetDiffArtifact()}
				/>,
			);
			expect(screen.getByText("Diff de conciliación")).toBeInTheDocument();
			expect(screen.getByTestId("lucide-Table")).toBeInTheDocument();
		});

		it("muestra filas totales, actualizadas y flagged desde el summary", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={sheetDiffArtifact()}
				/>,
			);
			expect(screen.getByText("42")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("Filas")).toBeInTheDocument();
			expect(screen.getByText("Actualizadas")).toBeInTheDocument();
			expect(screen.getByText("Flagged")).toBeInTheDocument();
		});
	});

	// ─── context: artifact + accounting_diff ───────────────────────────

	describe('context="artifact" — accounting_diff', () => {
		it("muestra el título del diff contable con el scope", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={accountingDiffArtifact()}
				/>,
			);
			expect(screen.getByText(/Diff contable: Mayo 2026/)).toBeInTheDocument();
			expect(screen.getByTestId("lucide-FileText")).toBeInTheDocument();
		});

		it("muestra la cantidad de cambios detectados", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={accountingDiffArtifact()}
				/>,
			);
			expect(screen.getByText("2 cambios detectados")).toBeInTheDocument();
		});

		it("muestra cada diff con field, before y after", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={accountingDiffArtifact()}
				/>,
			);
			expect(screen.getByText(/ingresos/)).toBeInTheDocument();
			expect(screen.getByText(/1000.*1200/)).toBeInTheDocument();
			expect(screen.getByText(/gastos/)).toBeInTheDocument();
			expect(screen.getByText(/800.*750/)).toBeInTheDocument();
		});
	});

	// ─── context: artifact + dashboard ─────────────────────────────────

	describe('context="artifact" — dashboard', () => {
		it("muestra el título 'Dashboard' con icono PieChart", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={dashboardArtifact()}
				/>,
			);
			expect(screen.getByText("Dashboard")).toBeInTheDocument();
			expect(screen.getByTestId("lucide-PieChart")).toBeInTheDocument();
		});

		it("muestra el primaryMetric (valor + tendencia)", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={dashboardArtifact()}
				/>,
			);
			expect(screen.getByText("S/ 12,450")).toBeInTheDocument();
			expect(screen.getByText("+8.3% vs mes anterior")).toBeInTheDocument();
		});

		it("muestra el statusScore en una barra de progreso", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={dashboardArtifact()}
				/>,
			);
			expect(screen.getByText("73%")).toBeInTheDocument();
		});
	});

	// ─── context: artifact + chart ─────────────────────────────────────

	describe('context="artifact" — chart', () => {
		it("muestra el título del gráfico", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={chartArtifact()}
				/>,
			);
			expect(screen.getByText("Evolución IGV")).toBeInTheDocument();
			expect(screen.getByTestId("lucide-BarChart3")).toBeInTheDocument();
		});

		it("renderiza barras para cada data point (hasta 8)", () => {
			const { container } = render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={chartArtifact()}
				/>,
			);
			// Busca los divs que hacen de barra dentro del contenedor flex
			const barContainer = container.querySelector(
				'div[style*="height: 48px"]',
			);
			expect(barContainer).toBeInTheDocument();

			const bars = barContainer?.querySelectorAll("div.w-full.rounded-t");
			expect(bars?.length).toBe(8);
		});
	});

	// ─── context: artifact — sin activeArtifact ────────────────────────

	describe('context="artifact" — sin activeArtifact', () => {
		it("muestra mensaje placeholder cuando no hay artifact activo", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="artifact"
					activeArtifact={null}
				/>,
			);
			expect(
				screen.getByText("Seleccioná un artifact para ver el preview."),
			).toBeInTheDocument();
		});
	});

	// ─── context: case ─────────────────────────────────────────────────

	describe('context="case" — con caseDetails', () => {
		it("muestra el título del caso fiscal y el icono ShieldAlert", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails()}
				/>,
			);
			expect(screen.getByText("Cierre fiscal mayo 2026")).toBeInTheDocument();
			expect(screen.getByTestId("lucide-ShieldAlert")).toBeInTheDocument();
		});

		it("muestra la cantidad de evidencias y agent runs", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails()}
				/>,
			);
			expect(screen.getByText("2")).toBeInTheDocument(); // evidence
			expect(screen.getByText("3")).toBeInTheDocument(); // agentRuns
			expect(screen.getByText("Evidencias")).toBeInTheDocument();
			expect(screen.getByText("Runs")).toBeInTheDocument();
		});

		it("muestra el risk badge con barra de progreso", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails({
						case: { ...fiscalCaseDetails().case, riskScore: 68 },
					})}
				/>,
			);
			expect(screen.getByText("Riesgo")).toBeInTheDocument();
		});

		it("colorea la barra de riesgo según el score — HIGH > 70 → red", () => {
			const { container } = render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails({
						case: { ...fiscalCaseDetails().case, riskScore: 85 },
					})}
				/>,
			);
			const bar = container.querySelector(".bg-red-500");
			expect(bar).toBeInTheDocument();
		});

		it("colorea la barra de riesgo según el score — MEDIUM 40-70 → amber", () => {
			const { container } = render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails({
						case: { ...fiscalCaseDetails().case, riskScore: 55 },
					})}
				/>,
			);
			const bar = container.querySelector(".bg-amber-500");
			expect(bar).toBeInTheDocument();
		});

		it("colorea la barra de riesgo según el score — LOW < 40 → success", () => {
			const { container } = render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails({
						case: { ...fiscalCaseDetails().case, riskScore: 25 },
					})}
				/>,
			);
			// After migrating from emerald-500 to var(--color-success), the progress bar
			// uses a CSS variable class. We verify the correct semantic token is applied.
			const bar = container.querySelector(
				'[class*="h-full"][class*="rounded-full"]',
			);
			expect(bar).toBeInTheDocument();
			expect(bar!.className).toContain("color-success");
		});

		it("muestra el contador de aprobaciones pendientes cuando pendingApprovalsCount > 0", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails()}
					pendingApprovalsCount={2}
				/>,
			);
			expect(
				screen.getByText(/2 aprobación\(es\) pendiente\(s\)/),
			).toBeInTheDocument();
			expect(screen.getByTestId("lucide-Clock")).toBeInTheDocument();
		});

		it("no muestra el contador de aprobaciones cuando pendingApprovalsCount es 0", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={fiscalCaseDetails()}
					pendingApprovalsCount={0}
				/>,
			);
			expect(
				screen.queryByText(/aprobación.*pendiente/),
			).not.toBeInTheDocument();
		});

		it("no oculta la barra de riesgo cuando riskScore es undefined", () => {
			const details = fiscalCaseDetails();
			// Crea una copia con riskScore undefined (prop eliminada)
			const { riskScore: _, ...caseWithoutRisk } = details.case;
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={{
						...details,
						case: caseWithoutRisk as typeof details.case,
					}}
				/>,
			);
			expect(screen.queryByText("Riesgo")).not.toBeInTheDocument();
		});
	});

	// ─── context: case — sin caseDetails ───────────────────────────────

	describe('context="case" — sin caseDetails', () => {
		it("muestra placeholder cuando no hay caso seleccionado", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="case"
					caseDetails={null}
				/>,
			);
			expect(screen.getByText("Sin caso seleccionado.")).toBeInTheDocument();
		});
	});

	// ─── Pinned Artifacts ──────────────────────────────────────────────

	describe("pinnedArtifacts", () => {
		it("no renderiza la sección cuando el array está vacío", () => {
			render(<ChatContextPanel {...defaultProps} pinnedArtifacts={[]} />);
			expect(screen.queryByText(/Fijados/)).not.toBeInTheDocument();
		});

		it("muestra el encabezado con el conteo de artifacts fijados", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					pinnedArtifacts={[sheetDiffArtifact()]}
				/>,
			);
			expect(screen.getByText("Fijados (1)")).toBeInTheDocument();
			expect(screen.getByTestId("lucide-Pin")).toBeInTheDocument();
		});

		it("muestra el título y resumen de cada artifact fijado", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					pinnedArtifacts={[
						sheetDiffArtifact(),
						chartArtifact(),
						explanationArtifact(),
					]}
				/>,
			);
			// Títulos
			expect(screen.getByText("Conciliación bancaria")).toBeInTheDocument();
			expect(screen.getByText("Evolución IGV")).toBeInTheDocument();
			expect(screen.getByText("Análisis de variación")).toBeInTheDocument();
			// Resúmenes vía getArtifactSummary
			expect(
				screen.getByText("42 filas · 8 act. · 3 flagged"),
			).toBeInTheDocument();
			expect(screen.getByText("Gráfico · 8 datos")).toBeInTheDocument();
		});

		it("muestra artifact.type como fallback cuando title está vacío", () => {
			const noTitleArtifact = {
				...chartArtifact(),
				title: "",
			} as HubArtifact;
			render(
				<ChatContextPanel
					{...defaultProps}
					pinnedArtifacts={[noTitleArtifact]}
				/>,
			);
			// getArtifactSummary devuelve type para chart: "Gráfico · N datos"
			expect(screen.getByText("Gráfico · 8 datos")).toBeInTheDocument();
		});

		it("no replica la sección pinned cuando no hay artifacts (contexto streaming)", () => {
			render(
				<ChatContextPanel
					{...defaultProps}
					context="streaming"
					isStreaming
					pinnedArtifacts={[]}
				/>,
			);
			expect(screen.queryByText(/Fijados/)).not.toBeInTheDocument();
		});
	});

	// ─── Wrapper de transición ─────────────────────────────────────────

	describe("transición y ciclo de vida", () => {
		it("aplica las clases transition-all duration-300 ease-in-out al wrapper interno", () => {
			const { container } = render(<ChatContextPanel {...defaultProps} />);
			const wrapper = container.querySelector(".transition-all");
			expect(wrapper).toBeInTheDocument();
			expect(wrapper).toHaveClass("duration-300", "ease-in-out");
		});

		it("cambia el contenido al cambiar de idle a streaming", () => {
			const { rerender } = render(<ChatContextPanel {...defaultProps} />);
			expect(screen.getByText("Contexto del chat")).toBeInTheDocument();

			rerender(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			expect(screen.getByText("Agente trabajando")).toBeInTheDocument();
			expect(screen.queryByText("Contexto del chat")).not.toBeInTheDocument();
		});

		it("cambia el header entre 'Procesando...' y 'Contexto' según isStreaming", () => {
			const { rerender } = render(
				<ChatContextPanel {...defaultProps} context="streaming" isStreaming />,
			);
			expect(screen.getByText("Procesando...")).toBeInTheDocument();

			rerender(
				<ChatContextPanel
					{...defaultProps}
					context="streaming"
					isStreaming={false}
				/>,
			);
			expect(screen.getByText("Contexto")).toBeInTheDocument();
		});
	});

	// ─── Header fijo ───────────────────────────────────────────────────

	describe("encabezado del panel", () => {
		it("muestra el icono Bot y el título 'Contexto' cuando no está streaming", () => {
			render(<ChatContextPanel {...defaultProps} />);
			expect(screen.getByTestId("lucide-Bot")).toBeInTheDocument();
			expect(screen.getByText("Contexto")).toBeInTheDocument();
		});
	});
});
