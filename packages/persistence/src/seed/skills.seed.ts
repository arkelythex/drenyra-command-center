import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { skillCapabilities, skills } from "../schema/skills.schema";

interface SeedSkill {
	name: string;
	description: string;
	category: "fiscal" | "finance" | "operations" | "audit";
	version: string;
	author: string;
	capabilities: Array<{
		name: string;
		description: string;
		actionType: string;
		sortOrder: number;
	}>;
}

const SEED_SKILLS: SeedSkill[] = [
	{
		name: "SIRE",
		description:
			"Validación y comparación de libros electrónicos con SUNAT. Consulta de RUC, descarga de XML/CDR, y preparación de declaraciones mensuales.",
		category: "fiscal",
		version: "2.1.0",
		author: "Drenyra",
		capabilities: [
			{
				name: "Validar RUC",
				description: "Consulta estado, condición y domicilio fiscal de un RUC",
				actionType: "sunat:validate-ruc",
				sortOrder: 1,
			},
			{
				name: "Consultar comprobantes",
				description: "Obtiene XML y CDR de comprobantes desde SUNAT",
				actionType: "sunat:fetch-cpe",
				sortOrder: 2,
			},
			{
				name: "Comparar SIRE",
				description: "Cruza libros electrónicos registrados con datos de SUNAT",
				actionType: "sunat:compare-sire",
				sortOrder: 3,
			},
			{
				name: "Preparar declaraciones",
				description: "Genera borradores de DJ IGV y DJ Renta mensual",
				actionType: "sunat:prepare-declaration",
				sortOrder: 4,
			},
		],
	},
	{
		name: "Tax Risk",
		description:
			"Análisis de riesgos fiscales: detracciones, percepciones, retenciones, crédito fiscal y gastos no deducibles.",
		category: "fiscal",
		version: "1.8.0",
		author: "Drenyra",
		capabilities: [
			{
				name: "Detracciones",
				description: "Valida montos, porcentajes y plazos de detracciones",
				actionType: "tax:detractions",
				sortOrder: 1,
			},
			{
				name: "Percepciones",
				description: "Control de percepciones y tasas aplicables",
				actionType: "tax:perceptions",
				sortOrder: 2,
			},
			{
				name: "Retenciones",
				description: "Gestión de retenciones de IGV y Renta",
				actionType: "tax:withholdings",
				sortOrder: 3,
			},
			{
				name: "Crédito fiscal",
				description:
					"Análisis de crédito fiscal y arrastres de períodos anteriores",
				actionType: "tax:tax-credit",
				sortOrder: 4,
			},
			{
				name: "Gastos no deducibles",
				description: "Identificación de gastos no deducibles para Renta anual",
				actionType: "tax:non-deductible",
				sortOrder: 5,
			},
		],
	},
	{
		name: "Close",
		description:
			"Asistente de cierre contable mensual: devengos, provisiones, diferencia de cambio, depreciación y cierre integral.",
		category: "operations",
		version: "1.5.0",
		author: "Drenyra",
		capabilities: [
			{
				name: "Devengos",
				description: "Registro y control de devengos del período",
				actionType: "close:accruals",
				sortOrder: 1,
			},
			{
				name: "Provisiones",
				description: "Cálculo y registro de provisiones contables",
				actionType: "close:provisions",
				sortOrder: 2,
			},
			{
				name: "Diferencia de cambio",
				description: "Cálculo de diferencias cambiarias del período",
				actionType: "close:fx-difference",
				sortOrder: 3,
			},
			{
				name: "Depreciación",
				description: "Cálculo de depreciación de activos fijos",
				actionType: "close:depreciation",
				sortOrder: 4,
			},
			{
				name: "Cierre mensual",
				description: "Ejecución del cierre mensual integral con validaciones",
				actionType: "close:monthly-close",
				sortOrder: 5,
			},
		],
	},
	{
		name: "Audit",
		description:
			"Generación de pistas de auditoría, trazabilidad de cambios y reportes preparados para revisión de SUNAT o terceros.",
		category: "audit",
		version: "1.3.0",
		author: "Drenyra",
		capabilities: [
			{
				name: "Evidencia",
				description: "Recolección y empaquetado de evidencia fiscal",
				actionType: "audit:evidence",
				sortOrder: 1,
			},
			{
				name: "Trazabilidad",
				description: "Traza de cambios y accesos a documentación contable",
				actionType: "audit:trail",
				sortOrder: 2,
			},
			{
				name: "Reporte para auditoría",
				description:
					"Generación de reportes formales para auditoría externa o SUNAT",
				actionType: "audit:report",
				sortOrder: 3,
			},
		],
	},
	{
		name: "Bank Reconciliation",
		description:
			"Conciliación bancaria automatizada con los principales bancos peruanos: BCP, BBVA, Interbank, Scotiabank y billeteras digitales.",
		category: "finance",
		version: "2.0.4",
		author: "Drenyra",
		capabilities: [
			{
				name: "BCP",
				description: "Conciliación con estados de cuenta BCP",
				actionType: "bank:bcp",
				sortOrder: 1,
			},
			{
				name: "BBVA",
				description: "Conciliación con estados de cuenta BBVA",
				actionType: "bank:bbva",
				sortOrder: 2,
			},
			{
				name: "Interbank",
				description: "Conciliación con movimientos Interbank",
				actionType: "bank:interbank",
				sortOrder: 3,
			},
			{
				name: "Scotiabank",
				description: "Conciliación con extractos Scotiabank",
				actionType: "bank:scotiabank",
				sortOrder: 4,
			},
			{
				name: "Yape / Plin empresarial",
				description: "Conciliación de pagos con billeteras digitales",
				actionType: "bank:digital-wallet",
				sortOrder: 5,
			},
		],
	},
	{
		name: "Payroll",
		description:
			"Gestión completa de planillas: cálculo de CTS, gratificaciones, Essalud, ONP y AFP. Preparación de registros y declaraciones.",
		category: "operations",
		version: "1.1.0",
		author: "Drenyra",
		capabilities: [
			{
				name: "Planillas",
				description: "Cálculo y registro de planillas mensuales",
				actionType: "payroll:payroll",
				sortOrder: 1,
			},
			{
				name: "CTS",
				description: "Cálculo de Compensación por Tiempo de Servicios",
				actionType: "payroll:cts",
				sortOrder: 2,
			},
			{
				name: "Gratificaciones",
				description: "Cálculo de gratificaciones legales (julio/diciembre)",
				actionType: "payroll:gratifications",
				sortOrder: 3,
			},
			{
				name: "Essalud",
				description: "Cálculo de aportes a Essalud",
				actionType: "payroll:essalud",
				sortOrder: 4,
			},
			{
				name: "ONP",
				description: "Cálculo de aportes al sistema nacional de pensiones",
				actionType: "payroll:onp",
				sortOrder: 5,
			},
			{
				name: "AFP",
				description:
					"Cálculo de aportes a AFP con comisiones y prima de seguro",
				actionType: "payroll:afp",
				sortOrder: 6,
			},
		],
	},
];

export async function seedSkills(db: NodePgDatabase) {
	console.log("📦 Seeding skills...");

	for (const seed of SEED_SKILLS) {
		const existing = await db
			.select({ id: skills.id })
			.from(skills)
			.where(eq(skills.name, seed.name))
			.limit(1);

		if (existing.length > 0) {
			console.log(`  ⏭️  ${seed.name} already exists, skipping`);
			continue;
		}

		const [skill] = await db
			.insert(skills)
			.values({
				name: seed.name,
				description: seed.description,
				category: seed.category,
				version: seed.version,
				author: seed.author,
				status: "active",
				metadata: {},
			})
			.returning();

		if (seed.capabilities.length > 0) {
			await db.insert(skillCapabilities).values(
				seed.capabilities.map((cap) => ({
					skillId: skill.id,
					name: cap.name,
					description: cap.description,
					actionType: cap.actionType,
					sortOrder: cap.sortOrder,
				})),
			);
		}

		console.log(`  ✅ ${seed.name} — ${seed.capabilities.length} capabilities`);
	}

	console.log("✅ Skills seeded successfully");
}
