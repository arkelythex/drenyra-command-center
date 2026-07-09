/**
 * ArtifactRenderer — Registry-driven generative UI
 *
 * Each artifact type is a self-registering component.
 * To add a new type: create renderers/XxxArtifact.tsx and call registerArtifact().
 *
 * @since Feb 2026
 */

import type { HubArtifact } from "@drenyra/shared/artifacts";
import React, { Suspense } from "react";
import { type ArtifactComponent, getRenderer } from "./artifact-registry";

type ArtifactRendererLoader = () => Promise<unknown>;

const ARTIFACT_RENDERER_LOADERS: Record<
	HubArtifact["type"],
	ArtifactRendererLoader
> = {
	explanation: () => import("./renderers/ExplanationArtifact"),
	chart: () => import("./renderers/ChartArtifact"),
	table: () => import("./renderers/TableArtifact"),
	action_card: () => import("./renderers/ActionCardArtifact"),
	simulation: () => import("./renderers/SimulationArtifact"),
	comparison: () => import("./renderers/ComparisonArtifact"),
	accounting_diff: () => import("./renderers/AccountingDiffArtifact"),
	sheet_diff: () => import("./renderers/SheetDiffArtifact"),
	search_result: () => import("./renderers/SearchResultArtifact"),
	report: () => import("./renderers/ReportArtifact"),
	knowledge_graph: () => import("./renderers/KnowledgeGraphArtifact"),
	dashboard: () => import("./renderers/DashboardArtifact"),
	banking_reconciliation: () =>
		import("./renderers/BankingReconciliationArtifact"),
	bills_payable: () => import("./renderers/BillsPayableArtifact"),
	cashflow_projection: () => import("./renderers/CashflowProjectionArtifact"),
	tax_summary: () => import("./renderers/TaxSummaryArtifact"),
	payroll_summary: () => import("./renderers/PayrollSummaryArtifact"),
};

function createLazyArtifactRenderer(type: HubArtifact["type"]) {
	return React.lazy(async () => {
		const loadRenderer = ARTIFACT_RENDERER_LOADERS[type];
		await loadRenderer();
		const Renderer = getRenderer(type);

		return {
			default: Renderer ?? UnknownArtifact,
		};
	});
}

const LAZY_ARTIFACT_RENDERERS: Record<
	HubArtifact["type"],
	React.LazyExoticComponent<ArtifactComponent>
> = {
	explanation: createLazyArtifactRenderer("explanation"),
	chart: createLazyArtifactRenderer("chart"),
	table: createLazyArtifactRenderer("table"),
	action_card: createLazyArtifactRenderer("action_card"),
	simulation: createLazyArtifactRenderer("simulation"),
	comparison: createLazyArtifactRenderer("comparison"),
	accounting_diff: createLazyArtifactRenderer("accounting_diff"),
	sheet_diff: createLazyArtifactRenderer("sheet_diff"),
	search_result: createLazyArtifactRenderer("search_result"),
	report: createLazyArtifactRenderer("report"),
	knowledge_graph: createLazyArtifactRenderer("knowledge_graph"),
	dashboard: createLazyArtifactRenderer("dashboard"),
	banking_reconciliation: createLazyArtifactRenderer("banking_reconciliation"),
	bills_payable: createLazyArtifactRenderer("bills_payable"),
	cashflow_projection: createLazyArtifactRenderer("cashflow_projection"),
	tax_summary: createLazyArtifactRenderer("tax_summary"),
	payroll_summary: createLazyArtifactRenderer("payroll_summary"),
};

export const ArtifactRenderer = ({ artifact }: { artifact: HubArtifact }) => {
	const Renderer = LAZY_ARTIFACT_RENDERERS[artifact.type];

	return (
		<Suspense fallback={<ArtifactRendererFallback />}>
			<Renderer artifact={artifact} />
		</Suspense>
	);
};

function UnknownArtifact({ artifact }: { artifact: HubArtifact }) {
	return (
		<div className="mt-6 rounded-lg border border-danger/20 bg-danger-subtle p-4 font-mono text-xs text-danger">
			Unknown artifact type: {artifact.type}
		</div>
	);
}

function ArtifactRendererFallback() {
	return (
		<div
			className="mt-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
			role="status"
			aria-live="polite"
		>
			<div className="h-4 w-40 animate-pulse rounded bg-[var(--surface-hover)]" />
			<div className="mt-3 h-20 animate-pulse rounded bg-[var(--surface-hover)]" />
			<span className="sr-only">Cargando renderer del artefacto</span>
		</div>
	);
}
