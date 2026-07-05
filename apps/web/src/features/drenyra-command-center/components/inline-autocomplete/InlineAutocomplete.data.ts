/**
 * InlineAutocomplete.data — Catálogo de referencias y comandos para
 * el autocompletado inline del Command Center.
 */

export interface AutocompleteItem {
	/** Prefijo trigger: @ para referencias, / para comandos */
	trigger: "@" | "/";
	/** Label visible en el menú */
	label: string;
	/** Descripción secundaria */
	description: string;
	/** Valor insertado al seleccionar (incluye ID si aplica) */
	insertValue: string;
	/** Categoría visual */
	category: "reference" | "command" | "agent";
}

/**
 * Referencias @ — objetos fiscales con ID explícito.
 * En producción, estos vendrían de una query a la API.
 */
export const REFERENCE_ITEMS: AutocompleteItem[] = [
	// ── Bancos ──
	{
		trigger: "@",
		label: "banco",
		description: "Cuenta bancaria (seleccionar instancia)",
		insertValue: "@banco(id:bco_001)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "banco:BNB",
		description: "Banco de la Nación — Cta. Cte. 000-123456",
		insertValue: "@banco(id:bco_bnb_cta001)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "banco:BCP",
		description: "BCP — Cta. Cte. 191-2345678",
		insertValue: "@banco(id:bco_bcp_cta001)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "banco:Interbank",
		description: "Interbank — Cta. Cte. 098-7654321",
		insertValue: "@banco(id:bco_interbank_cta001)",
		category: "reference",
	},

	// ── Ledger / Plan Contable ──
	{
		trigger: "@",
		label: "ledger",
		description: "Libro contable (seleccionar tipo)",
		insertValue: "@ledger(id:led_001)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "ledger:diario",
		description: "Libro Diario — 2026-07",
		insertValue: "@ledger(id:led_diario_0726)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "ledger:mayor",
		description: "Libro Mayor — 2026-07",
		insertValue: "@ledger(id:led_mayor_0726)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "ledger:inventarios",
		description: "Registro de Inventarios — 2026-07",
		insertValue: "@ledger(id:led_inventarios_0726)",
		category: "reference",
	},

	// ── Comprobantes ──
	{
		trigger: "@",
		label: "facturas",
		description: "Comprobantes de venta (período activo)",
		insertValue: "@facturas(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "facturas:emitidas",
		description: "Facturas emitidas — período activo",
		insertValue: "@facturas(tipo:emitidas, period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "facturas:recibidas",
		description: "Facturas recibidas de proveedores — período activo",
		insertValue: "@facturas(tipo:recibidas, period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "boletas",
		description: "Boletas de venta — período activo",
		insertValue: "@boletas(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "notas-credito",
		description: "Notas de crédito — período activo",
		insertValue: "@notas-credito(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "notas-debito",
		description: "Notas de débito — período activo",
		insertValue: "@notas-debito(period:2026-07)",
		category: "reference",
	},

	// ── Fiscal ──
	{
		trigger: "@",
		label: "sire",
		description: "Declaración SIRE del período activo",
		insertValue: "@sire(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "igv",
		description: "Cálculo IGV 18% del período activo",
		insertValue: "@igv(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "detracciones",
		description: "Detracciones del período activo",
		insertValue: "@detracciones(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "retenciones",
		description: "Retenciones del período activo",
		insertValue: "@retenciones(period:2026-07)",
		category: "reference",
	},
	{
		trigger: "@",
		label: "plame",
		description: "PLAME — planilla electrónica",
		insertValue: "@plame(period:2026-07)",
		category: "reference",
	},
];

/**
 * Comandos / — acciones ejecutables.
 */
export const COMMAND_ITEMS: AutocompleteItem[] = [
	{
		trigger: "/",
		label: "reconcile",
		description: "Reconciliar banco vs ledger del período",
		insertValue: "/reconcile",
		category: "command",
	},
	{
		trigger: "/",
		label: "audit",
		description: "Auditar inconsistencias fiscales",
		insertValue: "/audit",
		category: "command",
	},
	{
		trigger: "/",
		label: "sire",
		description: "Generar / revisar declaración SIRE",
		insertValue: "/sire",
		category: "command",
	},
	{
		trigger: "/",
		label: "risk",
		description: "Analizar riesgo fiscal del período",
		insertValue: "/risk",
		category: "command",
	},
	{
		trigger: "/",
		label: "validate",
		description: "Validar IGV y totales de comprobantes",
		insertValue: "/validate",
		category: "command",
	},
	{
		trigger: "/",
		label: "close",
		description: "Ejecutar cierre mensual",
		insertValue: "/close",
		category: "command",
	},
	{
		trigger: "/",
		label: "simulate",
		description: "Simular escenario fiscal",
		insertValue: "/simulate",
		category: "command",
	},
	{
		trigger: "/",
		label: "compacto",
		description: "Cambiar a modo compacto",
		insertValue: "/compacto",
		category: "command",
	},
	{
		trigger: "/",
		label: "detalle",
		description: "Cambiar a modo detalle",
		insertValue: "/detalle",
		category: "command",
	},
	{
		trigger: "/",
		label: "help",
		description: "Mostrar ayuda de comandos",
		insertValue: "/help",
		category: "command",
	},
];

export const ALL_AUTOCOMPLETE_ITEMS: AutocompleteItem[] = [
	...REFERENCE_ITEMS,
	...COMMAND_ITEMS,
];

export function filterItems(
	trigger: "@" | "/",
	query: string,
	items: AutocompleteItem[] = ALL_AUTOCOMPLETE_ITEMS,
): AutocompleteItem[] {
	const q = query.toLowerCase();
	return items
		.filter(
			(item) =>
				item.trigger === trigger &&
				(item.label.toLowerCase().includes(q) ||
					item.description.toLowerCase().includes(q)),
		)
		.slice(0, 12);
}
