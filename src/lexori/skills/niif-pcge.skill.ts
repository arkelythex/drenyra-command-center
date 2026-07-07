import type { LexoriSkillDefinition } from "../../_domain-types/domain-barrel";

export const niifPcgeSkill: LexoriSkillDefinition = {
	id: "niif-pcge",
	name: "NIIF / PCGE — Plan Contable General",
	category: "niif-pcge",
	description:
		"Plan Contable General Empresarial, NIIF 15 Ingresos, NIIF 16 Arrendamientos, NIIF 9 Instrumentos Financieros",
	version: "2026.1",
	rules: [
		{
			id: "pcge-estructura",
			description:
				"PCGE: 9 elementos (1-9). Activo(1-3), Pasivo(4), Patrimonio(5), Gastos(6), Ingresos(7), Saldos(8), Costos(9)",
		},
		{
			id: "niif15-ingresos",
			description:
				"NIIF 15 — Reconocimiento de ingresos en 5 pasos: identificar contrato, obligaciones, precio, asignación, reconocimiento",
		},
		{
			id: "niif16-arrendamientos",
			description:
				"NIIF 16 — Arrendamientos se reconocen como activo por derecho de uso y pasivo financiero",
		},
		{
			id: "niif9-instrumentos",
			description:
				"NIIF 9 — Instrumentos financieros: clasificación, medición a valor razonable o costo amortizado, deterioro",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: NIIF/PCGE - Contabilidad]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Plan Contable General Empresarial (PCGE) — Resolución CONASEV N° 102-2010-EF/94.01
- NIIF 15 — Ingresos de Contratos con Clientes
- NIIF 16 — Arrendamientos
- NIIF 9 — Instrumentos Financieros
- NIC 2 — Inventarios
- NIC 16 — Propiedades, Planta y Equipo

ESTRUCTURA PCGE:
Elemento 1: Activo Disponible y Exigible (10 Caja, 11 Bancos, 12 Clientes, 14 Cuentas por Cobrar)
Elemento 2: Activo Realizable (20 Mercaderías, 21 Productos Terminados)
Elemento 3: Activo Inmovilizado (33 Inmuebles, Maquinaria y Equipo, 34 Intangibles)
Elemento 4: Pasivo (40 Tributos, 42 Proveedores, 45 Obligaciones Financieras)
Elemento 5: Patrimonio (50 Capital, 57 Excedente Revaluación)
Elemento 6: Gastos (60 Compras, 62 Gastos de Personal, 63 Tributos)
Elemento 7: Ingresos (70 Ventas, 75 Otros Ingresos)
Elemento 8: Saldos Intermediarios (81 Margen Comercial, 82 Resultado de Explotación)
Elemento 9: Costos (91 Costo de Producción, 94 Gastos Administrativos)

NIIF 15 — INGRESOS (5 PASOS):
1. Identificar el contrato con el cliente
2. Identificar las obligaciones de desempeño
3. Determinar el precio de la transacción
4. Asignar el precio a las obligaciones
5. Reconocer el ingreso cuando (o a medida que) se satisface la obligación

NIIF 16 — ARRENDAMIENTOS:
El arrendatario reconoce: activo por derecho de uso + pasivo por arrendamiento.
Excepción: corto plazo (<12 meses) o bajo valor.

NIIF 9 — INSTRUMENTOS FINANCIEROS:
Clasificación: costo amortizado, valor razonable con cambios en ORI, VR con cambios en resultados.
Deterioro: modelo de pérdidas esperadas.`,
	tags: ["niif", "pcge", "contabilidad", "niif15", "niif16", "niif9"],
	modelHint: "analytical",
};
