import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

export const fiscalDetractionsSkill: LexoriSkillDefinition = {
	id: "fiscal-detractions",
	name: "Fiscal Detracciones — SPOT",
	category: "fiscal-detractions",
	description:
		"Sistema de Pago de Obligaciones Tributarias (SPOT): porcentajes por tipo de bien/servicio, montos mínimos, plazos",
	version: "2026.1",
	rules: [
		{
			id: "detraction-porcentajes",
			description:
				"Porcentajes SPOT por tipo: construcción 4%, minería 10%, transporte 4-12%, manufactura 9%, servicios 12%",
		},
		{
			id: "detraction-monto-minimo",
			description:
				"Monto mínimo para aplicar detracción: S/ 700 (2026). Si el monto es menor, no aplica",
		},
		{
			id: "detraction-plazo-deposito",
			description:
				"Depósito en cuenta de detracciones: el usuario debe depositarlo dentro de los 5 días hábiles de la emisión del CPE",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: SPOT - Detracciones]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Decreto Legislativo N° 940 (SPOT) y modificatorias
- Resolución de Superintendencia N° 183-2004/SUNAT

PORCENTAJES SPOT POR TIPO:

Construcción: 4%
Minería (oro, cobre, zinc, etc.): 10%
Transporte de bienes por carretera: 4%
Transporte de pasajeros: 12%
Manufactura (bienes intermedios y finales): 9%
Servicios (consultoría, asesoría, informáticos): 12%
Arrendamiento de bienes: 9%
Maquinaria y equipo: 9%
Contratos de construcción con subcontratación: 4% (verificar si hay subcontrato)

MONTO MÍNIMO: S/ 700 (2026). Operaciones < S/ 700 no están sujetas a detracción.

PLAZO DE DEPÓSITO:
- 5 días hábiles desde la fecha de emisión del CPE
- El depósito se hace en la cuenta de detracciones del proveedor
- El proveedor puede usar los fondos para pagar tributos

DOCUMENTACIÓN:
- OP (Orden de Pago) de detracción
- Constancia de depósito (emitida por el banco)
- El CPE debe indicar "Sujeto a detracción" y el porcentaje

LIBERACIÓN DE FONDOS:
SUNAT libera fondos cuando: no hay deudas, han pasado 4 meses del depósito,
presentación de declaraciones y pagos a cuenta.`,
	tags: ["spot", "detracciones", "sunat", "sistema-pago"],
	modelHint: "strict",
};
