import type { NavigateOptions } from "@tanstack/react-router";
import { isAvailableNavPath } from "../available-nav-paths";
import { type Command, commandRegistry } from "./command-registry";

/**
 * Register default navigation and action commands.
 * Call once at app init.
 */
export function registerDefaultCommands(
	navigate: (opts: NavigateOptions) => void,
): void {
	const navCommands: Array<Command & { to: string }> = [
		{
			id: "nav-inbox",
			label: "Bandeja de atención",
			description: "Tareas críticas, fechas límite y cola de revisión",
			category: "navigation",
			icon: "Inbox",
			shortcut: "⌘1",
			to: "/inbox",
			execute: () => navigate({ to: "/inbox" }),
			keywords: ["tareas", "pendientes", "bandeja", "alertas"],
		},
		{
			id: "nav-close",
			label: "Cierre mensual",
			description: "Espacio de trabajo del cierre contable",
			category: "navigation",
			icon: "CalendarCheck",
			shortcut: "⌘2",
			to: "/cierre-mensual",
			execute: () => navigate({ to: "/cierre-mensual" }),
			keywords: ["cierre", "mensual", "periodo", "contable"],
		},
		{
			id: "nav-banking",
			label: "Bancos y tesorería",
			description: "Cuentas bancarias, movimientos y saldos",
			category: "navigation",
			icon: "Landmark",
			to: "/banking",
			execute: () => navigate({ to: "/banking" }),
			keywords: ["bancos", "tesoreria", "cuentas", "saldos"],
		},
		{
			id: "nav-invoices",
			label: "Comprobantes",
			description: "Facturas, notas de crédito y débito",
			category: "navigation",
			icon: "Receipt",
			to: "/invoices",
			execute: () => navigate({ to: "/invoices" }),
			keywords: ["facturas", "comprobantes", "cobros"],
		},
		{
			id: "nav-ledger",
			label: "Libro Mayor",
			description: "Asientos y saldos por cuenta contable",
			category: "navigation",
			icon: "Layers",
			to: "/contabilidad/ledger",
			execute: () => navigate({ to: "/contabilidad/ledger" }),
			keywords: ["mayor", "asientos", "contabilidad", "cuentas"],
		},
		{
			id: "nav-sire",
			label: "SIRE / SUNAT",
			description: "Registros electrónicos SUNAT y reconciliación SIRE",
			category: "navigation",
			icon: "FileCheck",
			to: "/cumplimiento/expedientes",
			execute: () => navigate({ to: "/cumplimiento/expedientes" }),
			keywords: ["sire", "sunat", "rce", "rvie", "electronico"],
		},
		{
			id: "nav-review-queue",
			label: "Cola de revisión",
			description: "Aprobaciones, decisiones y revisiones pendientes",
			category: "navigation",
			icon: "Search",
			shortcut: "⌘3",
			to: "/review-queue",
			execute: () => navigate({ to: "/review-queue" }),
			keywords: ["revision", "aprobacion", "cola", "pendientes"],
		},
		{
			id: "nav-evidence",
			label: "Bóveda de evidencia",
			description: "Documentos, evidencias y recepciones",
			category: "navigation",
			icon: "FileSearch",
			to: "/evidence",
			execute: () => navigate({ to: "/evidence" }),
			keywords: ["evidencia", "documentos", "boveda", "receipts"],
		},
		{
			id: "nav-financials",
			label: "Estados financieros",
			description: "Balance general, resultados y reportes",
			category: "navigation",
			icon: "BarChart3",
			to: "/financials",
			execute: () => navigate({ to: "/financials" }),
			keywords: ["estados", "financieros", "balance", "resultados"],
		},
		{
			id: "nav-compliance",
			label: "Cumplimiento fiscal",
			description: "Validaciones fiscales y riesgos SUNAT",
			category: "navigation",
			icon: "ShieldCheck",
			to: "/compliance",
			execute: () => navigate({ to: "/compliance" }),
			keywords: ["cumplimiento", "fiscal", "riesgos", "sunat"],
		},
		{
			id: "nav-companies",
			label: "Empresas",
			description: "Gestión de empresas y alcance por RUC",
			category: "navigation",
			icon: "Building2",
			to: "/firm/clients",
			execute: () => navigate({ to: "/firm/clients" }),
			keywords: ["empresas", "clientes", "ruc", "firma"],
		},
		{
			id: "nav-settings",
			label: "Configuración",
			description: "Preferencias, seguridad y perfil",
			category: "navigation",
			icon: "Settings",
			shortcut: "⌘,",
			to: "/settings",
			execute: () => navigate({ to: "/settings" }),
			keywords: ["configuracion", "ajustes", "preferencias"],
		},
	];

	const actionCommands: Command[] = [
		{
			id: "action-new-thread",
			label: "Nueva revisión fiscal",
			description: "Crear una nueva revisión o investigación fiscal",
			category: "execution",
			icon: "Plus",
			shortcut: "⌘N",
			riskLevel: "R1",
			execute: () => navigate({ to: "/drenyra" }),
			keywords: ["nuevo", "crear", "revision", "investigacion"],
		},
		{
			id: "action-toggle-sidebar",
			label: "Alternar barra lateral",
			description: "Mostrar u ocultar la barra lateral",
			category: "execution",
			icon: "PanelLeftClose",
			shortcut: "⌘B",
			riskLevel: "R0",
			execute: () => {
				// This will be wired to the actual store at runtime
				window.dispatchEvent(new CustomEvent("cmd:toggle-sidebar"));
			},
			keywords: ["sidebar", "barra", "lateral", "toggle"],
		},
		{
			id: "action-toggle-right-panel",
			label: "Alternar panel derecho",
			description: "Mostrar u ocultar el panel de inspección derecho",
			category: "execution",
			icon: "PanelRightClose",
			shortcut: "⌘\\",
			riskLevel: "R0",
			execute: () => {
				window.dispatchEvent(new CustomEvent("cmd:toggle-right-panel"));
			},
			keywords: ["panel", "derecho", "inspector", "toggle"],
		},
		{
			id: "action-toggle-terminal",
			label: "Abrir terminal",
			description: "Mostrar u ocultar el panel de terminal",
			category: "execution",
			icon: "Terminal",
			shortcut: "⌘`",
			riskLevel: "R0",
			execute: () => {
				window.dispatchEvent(new CustomEvent("cmd:toggle-terminal"));
			},
			keywords: ["terminal", "consola", "comandos"],
		},
	];

	commandRegistry.registerMany([
		...navCommands.filter((command) => isAvailableNavPath(command.to)),
		...actionCommands,
	]);
}
