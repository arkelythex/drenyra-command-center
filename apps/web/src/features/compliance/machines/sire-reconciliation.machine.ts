/**
 * @deprecated This machine has been migrated to the ProcessMachine factory.
 * Use `createProcessMachine` from `@/lib/process-machine` instead.
 * See `process-machine.ts` for the factory API and migration guide.
 *
 * This file is kept for reference and backward compatibility.
 * It will be removed in a future cleanup pass.
 */

import { assign } from "xstate";
import { createProcessMachine } from "@/lib/process-machine";
import { parseSireFile } from "../services/sire-parser";
import type {
	ReconciliationStats,
	SireDiscrepancy,
	SireRecord,
} from "../types/sire.types";

export interface SireReconciliationContext {
	sunatRecords: SireRecord[];
	localRecords: SireRecord[];
	discrepancies: SireDiscrepancy[];
	stats: ReconciliationStats | null;
	error: string | null;
	pendingFile: File | null;
}

export type SireReconciliationEvent =
	| { type: "PROCESS_FILE"; file: File }
	| { type: "RETRY" }
	| { type: "RESET" };

const DEFAULT_LOCAL_RECORDS: SireRecord[] = [
	{
		periodo: "202501",
		caratula: "RVIE",
		rucEmisor: "20100000001",
		razonSocial: "PROVEEDOR A S.A.C.",
		tipoComprobante: "01",
		serie: "F001",
		numero: "00001234",
		fechaEmision: "2025-01-10",
		moneda: "PEN",
		baseImponible: 1000,
		igv: 180,
		total: 1180,
		estado: "ACTIVO",
		origen: "ARKELYTHEX",
	},
	{
		periodo: "202501",
		caratula: "RVIE",
		rucEmisor: "20300000003",
		razonSocial: "PROVEEDOR C S.A.",
		tipoComprobante: "01",
		serie: "F001",
		numero: "00000999",
		fechaEmision: "2025-01-20",
		moneda: "PEN",
		baseImponible: 200,
		igv: 36,
		total: 236,
		estado: "ACTIVO",
		origen: "ARKELYTHEX",
	},
];

function calculateDiscrepancies(
	sunatRecords: SireRecord[],
	localRecords: SireRecord[],
): { discrepancies: SireDiscrepancy[]; stats: ReconciliationStats } {
	const diffs: SireDiscrepancy[] = [];

	sunatRecords.forEach((sunat) => {
		const match = localRecords.find(
			(local) =>
				local.rucEmisor === sunat.rucEmisor &&
				local.serie === sunat.serie &&
				local.numero === sunat.numero,
		);

		if (!match) {
			diffs.push({
				id: `diff_${sunat.serie}_${sunat.numero}`,
				type: "MISSING_IN_ARKELYTHEX",
				severity: "HIGH",
				recordSunat: sunat,
			});
		} else if (Math.abs(match.total - sunat.total) > 0.1) {
			diffs.push({
				id: `diff_${sunat.serie}_${sunat.numero}`,
				type: "AMOUNT_MISMATCH",
				severity: "MEDIUM",
				recordSunat: sunat,
				recordLocal: match,
				diffAmount: Math.abs(match.total - sunat.total),
			});
		}
	});

	localRecords.forEach((local) => {
		const match = sunatRecords.find(
			(sunat) =>
				sunat.rucEmisor === local.rucEmisor &&
				sunat.serie === local.serie &&
				sunat.numero === local.numero,
		);

		if (!match && sunatRecords.length > 0) {
			diffs.push({
				id: `diff_${local.serie}_${local.numero}`,
				type: "MISSING_IN_SUNAT",
				severity: "MEDIUM",
				recordLocal: local,
			});
		}
	});

	const stats: ReconciliationStats = {
		totalSunat: sunatRecords.reduce((sum, r) => sum + r.total, 0),
		totalLocal: localRecords.reduce((sum, r) => sum + r.total, 0),
		matchCount: sunatRecords.length + localRecords.length - diffs.length,
		discrepancyCount: diffs.length,
		igvGap:
			sunatRecords.reduce((sum, r) => sum + r.igv, 0) -
			localRecords.reduce((sum, r) => sum + r.igv, 0),
	};

	return { discrepancies: diffs, stats };
}

export const sireReconciliationMachine = createProcessMachine({
	id: "sireReconciliation",
	context: {
		sunatRecords: [] as SireRecord[],
		localRecords: DEFAULT_LOCAL_RECORDS,
		discrepancies: [] as SireDiscrepancy[],
		stats: null as ReconciliationStats | null,
		error: null,
		pendingFile: null as File | null,
	},
	initial: "idle",
	onProcess: async (context) => {
		if (!context.pendingFile) throw new Error("No file provided");
		const sunatRecords = await parseSireFile(context.pendingFile);
		return { sunatRecords, pendingFile: null as File | null };
	},
	onAnalyze: async (context) => {
		const { discrepancies, stats } = calculateDiscrepancies(
			context.sunatRecords,
			context.localRecords,
		);
		return { discrepancies, stats };
	},
	states: {
		idle: {
			on: {
				PROCESS_FILE: {
					target: "processing",
					actions: assign({
						pendingFile: ({ event }: { event: unknown }) =>
							(event as { file: File }).file,
					}),
				},
			},
		},
		error: {
			on: {
				RETRY: { target: "idle" },
				PROCESS_FILE: {
					target: "processing",
					actions: assign({
						pendingFile: ({ event }: { event: unknown }) =>
							(event as { file: File }).file,
					}),
				},
			},
		},
	},
});
