import type { QuickReference, SkillCommand } from "./AgenticCommandBar.types";

export const QUICK_REFERENCES: QuickReference[] = [
	{
		prefix: "@",
		label: "@facturas",
		description: "Buscar en facturas del periodo activo",
		action: () => {},
	},
	{
		prefix: "@",
		label: "@banco",
		description: "Buscar en movimientos bancarios",
		action: () => {},
	},
	{
		prefix: "@",
		label: "@comprobantes",
		description: "Buscar en SIRE comprobantes",
		action: () => {},
	},
	{
		prefix: "@",
		label: "@cliente",
		description: "Cambiar cliente activo",
		action: () => {},
	},
];

export const SKILL_COMMANDS: SkillCommand[] = [
	{
		prefix: "/",
		label: "/sire",
		description: "Validar SIRE compras del periodo",
		action: () => {},
	},
	{
		prefix: "/",
		label: "/close",
		description: "Preparar cierre mensual",
		action: () => {},
	},
	{
		prefix: "/",
		label: "/audit",
		description: "Revisar riesgos fiscales",
		action: () => {},
	},
	{
		prefix: "/",
		label: "/sunat",
		description: "Consultar SUNAT en vivo",
		action: () => {},
	},
	{
		prefix: "/",
		label: "/reconcile",
		description: "Conciliar cuentas bancarias",
		action: () => {},
	},
];

export const QUICK_PROMPTS = [
	"Preparar declaración IGV para Andes Capital Jun 2026",
	"Conciliar bancos del periodo activo",
	"Revisar compras SIRE — detectar diferencias",
	"Cerrar mes con todos los skills disponibles",
	"Buscar riesgos fiscales en el periodo",
];

export const COMMAND_BAR_PLACEHOLDER =
	"Ask Drenyra anything... @facturas /sire /audit";
