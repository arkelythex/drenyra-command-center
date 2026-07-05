import type {
	ReconciliationLedgerEntry,
	ReconciliationTransaction,
} from "./reconciliation.types";

export const RECONCILIATION_LEDGER_ENTRIES: readonly ReconciliationLedgerEntry[] =
	[
		{
			id: "l1",
			date: "15 ENE",
			vendor: "AMAZON WEB SERVICES",
			amount: -450.5,
			reference: "AST-l1",
		},
		{
			id: "l2",
			date: "14 ENE",
			vendor: "ENTERPRISE CORP",
			amount: 15000,
			reference: "AST-l2",
		},
		{
			id: "l3",
			date: "14 ENE",
			vendor: "BCP COMISIONES",
			amount: -50,
			reference: "AST-l3",
		},
		{
			id: "l4",
			date: "13 ENE",
			vendor: "GOOGLE CLOUD PERU",
			amount: -320.1,
			reference: "AST-l4",
		},
	] as const;

export const RECONCILIATION_TRANSACTIONS: readonly ReconciliationTransaction[] =
	[
		{
			id: "b1",
			date: "15 ENE",
			description: "PAGO FACTURA AWS - 12345",
			amount: -450.5,
			status: "matched",
			confidence: 100,
			matchedLedgerId: "l1",
			notes: "Coincidencia exacta ya aplicada.",
			candidates: [],
		},
		{
			id: "b2",
			date: "14 ENE",
			description: "TRANSFERENCIA RECIBIDA - ENTERPRISE",
			amount: 15000,
			status: "suggested",
			confidence: 98,
			matchedLedgerId: "l2",
			notes: "Coincidencia lista para aprobar con evidencia completa.",
			candidates: [
				{
					id: "c-b2-l2",
					ledgerEntryId: "l2",
					vendor: "ENTERPRISE CORP",
					amount: 15000,
					score: 98,
					rationale: "Monto exacto, fecha alineada y contraparte normalizada.",
					sourceRecords: [
						"Extracto BCP 14 ENE",
						"Asiento AST-l2",
						"Invoice collection batch 0314",
					],
					impact:
						"Al aprobar, el ingreso queda conciliado y sale de la cola del cierre.",
					proposedDiff: [
						"Marcar movimiento como reconciliado",
						"Vincular extracto BCP con AST-l2",
						"Registrar evidencia de matching automatico asistido",
					],
				},
			],
		},
		{
			id: "b3",
			date: "14 ENE",
			description: "COMISION MANTENIMIENTO CTA",
			amount: -50,
			status: "needs_review",
			confidence: 74,
			notes: "Hay coincidencia probable, pero requiere validación humana.",
			candidates: [
				{
					id: "c-b3-l3",
					ledgerEntryId: "l3",
					vendor: "BCP COMISIONES",
					amount: -50,
					score: 74,
					rationale:
						"Monto coincide, pero falta soporte documental y la glosa bancaria es ambigua.",
					sourceRecords: ["Extracto BCP 14 ENE", "Asiento AST-l3"],
					impact:
						"Si se aprueba sin soporte, la comisión queda conciliada pero sin evidencia completa.",
					proposedDiff: [
						"Confirmar gasto bancario recurrente",
						"Adjuntar soporte o política interna",
						"Marcar como conciliación con revisión humana",
					],
				},
			],
		},
		{
			id: "b4",
			date: "13 ENE",
			description: "GOOGLE CLOUD IRELAND",
			amount: -320.1,
			status: "unmatched",
			confidence: 42,
			notes:
				"No hay match confiable. Requiere búsqueda manual o creación de asiento.",
			candidates: [
				{
					id: "c-b4-l4",
					ledgerEntryId: "l4",
					vendor: "GOOGLE CLOUD PERU",
					amount: -320.1,
					score: 42,
					rationale:
						"Monto cercano, pero la entidad legal no coincide con suficiente confianza.",
					sourceRecords: ["Extracto BCP 13 ENE", "Asiento AST-l4"],
					impact:
						"No se recomienda autoaprobar. Puede generar conciliación incorrecta.",
					proposedDiff: [
						"Verificar proveedor exacto y moneda",
						"Corregir tercero contable si aplica",
						"Crear asiento manual si no existe soporte válido",
					],
				},
			],
		},
	] as const;
