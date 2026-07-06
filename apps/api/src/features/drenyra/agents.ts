import type { AgentDefinition } from "@drenyra/drenyra-orchestrator/erp-types";
import {
	complianceTools,
	financeTools,
	operationsTools,
	systemAdminTools,
} from "./tools";

/** Sub-agent names for Drenyra fiscal agents. */
type DrenyraSubagentName = "Funde" | "Vigila" | "Regula" | "Archiva";

type AgentMeta = {
	drenyraSubagent: DrenyraSubagentName;
};

/**
 * createFinanceAgent operation.
 *
 * @returns Result of createFinanceAgent.
 * @example
 * ```ts
 * const result = createFinanceAgent();
 * console.log(result);
 * ```
 */
function withMeta(def: AgentDefinition, meta: AgentMeta): AgentDefinition {
	return { ...def, drenyraSubagent: meta.drenyraSubagent };
}

export function createFinanceAgent(): AgentDefinition {
	return withMeta(
		{
			id: "finance",
			name: "Finance Agent",
			description:
				"Ciclo financiero completo: bancos, cobros, pagos, conciliación, libro mayor",
			systemPrompt:
				"Gestionás todo el ciclo financiero: cuentas bancarias, flujo de caja, cobros (invoices), pagos (bills), conciliación, libro contable y estados financieros. Las conciliaciones y matching las hacés automático. Pagos y creación de invoices requieren aprobación. Integrás con bancos vía banking-sync.",
			tools: financeTools,
		},
		{ drenyraSubagent: "Funde" },
	);
}

/**
 * createOperationsAgent operation.
 *
 * @returns Result of createOperationsAgent.
 * @example
 * ```ts
 * const result = createOperationsAgent();
 * console.log(result);
 * ```
 */
export function createOperationsAgent(): AgentDefinition {
	return withMeta(
		{
			id: "operations",
			name: "Operations Agent",
			description:
				"Ciclo operativo del negocio: clientes, proveedores, inventario, productos, documentos",
			systemPrompt:
				"Gestionás el ciclo operativo del negocio: clientes, proveedores, terceros, inventario, productos y documentos. Cuando un cliente compra, creás el producto si no existe, actualizás inventario, y generás el comprobante. Operás con autonomía para todo lo que no sea financiero/fiscal.",
			tools: operationsTools,
		},
		{ drenyraSubagent: "Vigila" },
	);
}

/**
 * createComplianceAgent operation.
 *
 * @returns Result of createComplianceAgent.
 * @example
 * ```ts
 * const result = createComplianceAgent();
 * console.log(result);
 * ```
 */
export function createComplianceAgent(): AgentDefinition {
	return withMeta(
		{
			id: "compliance",
			name: "Compliance (Fiscal) Agent",
			description:
				"Ciclo fiscal peruano: SUNAT, IGV, SIRE, CPE, cierre contable, auditoría",
			systemPrompt:
				"Sos el agente fiscal de ARKELYTHEX. Tu trabajo es la precisión absoluta. Gestionás expedientes fiscales, cierre mensual, impuestos (IGV, renta), envío SUNAT, detracciones, retenciones, SIRE, y auditoría. Operás bajo el principio: AI propone, humano aprueba. TODO lo que toca SUNAT o cierre contable requiere fiscal_gate. Mantenés un audit trail inmutable de cada acción.",
			tools: complianceTools,
		},
		{ drenyraSubagent: "Regula" },
	);
}

/**
 * createSystemAdminAgent operation.
 *
 * @returns Result of createSystemAdminAgent.
 * @example
 * ```ts
 * const result = createSystemAdminAgent();
 * console.log(result);
 * ```
 */
export function createSystemAdminAgent(): AgentDefinition {
	return withMeta(
		{
			id: "system-admin",
			name: "System Admin Agent",
			description:
				"Configuración del sistema: usuarios, integraciones, surfaces, perfil",
			systemPrompt:
				"Gestionás la configuración del sistema: usuarios, permisos, conexiones externas, integraciones, y surfaces del producto. Ayudás al usuario a configurar su instancia de ARKELYTHEX.",
			tools: systemAdminTools,
		},
		{ drenyraSubagent: "Archiva" },
	);
}

/**
 * createAllAgents operation.
 *
 * @returns Result of createAllAgents.
 * @example
 * ```ts
 * const result = createAllAgents();
 * console.log(result);
 * ```
 */
export function createAllAgents(): AgentDefinition[] {
	return [
		createFinanceAgent(),
		createOperationsAgent(),
		createComplianceAgent(),
		createSystemAdminAgent(),
	];
}
