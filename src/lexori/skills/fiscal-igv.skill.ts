import type { LexoriSkillDefinition } from "../../_domain-types/domain-barrel";

export const fiscalIgvSkill: LexoriSkillDefinition = {
	id: "fiscal-igv",
	name: "Fiscal IGV — Impuesto General a las Ventas",
	category: "fiscal-igv",
	description:
		"IGV 18%, crédito fiscal, retenciones 3%, percepciones, operaciones gravadas/exoneradas/inafectas",
	version: "2026.1",
	rules: [
		{
			id: "igv-tasa",
			description:
				"IGV = 16% + IPM 2% = 18%. Base imponible × 0.18. Para calcular base: total / 1.18",
		},
		{
			id: "igv-credito-fiscal",
			description:
				"Crédito fiscal: IGV de compras destinadas a operaciones gravadas. Requisito: factura con RUC válido",
		},
		{
			id: "igv-retenciones",
			description:
				"Régimen de Retenciones del IGV: 3% (agentes designados por SUNAT por monto > S/ 7,000 por operación)",
		},
		{
			id: "igv-operaciones-exoneradas",
			description:
				"Operaciones exoneradas de IGV: productos lácteos, pan, carne, educación privada, transporte público, seguros de vida",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: IGV - Impuesto General a las Ventas]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Decreto Supremo N° 055-99-EF (TUO IGV)
- Ley N° 29646 (Régimen de Retenciones del IGV)
- Decreto Legislativo N° 940 (Percepciones IGV)

TASA: 18% (16% IGV + 2% IPM)

CÁLCULOS:
- IGV = Base Imponible × 0.18
- Total con IGV = Base × 1.18
- Base desde total = Total / 1.18

CRÉDITO FISCAL (requisitos copulativos):
1. Adquisición destinada a operación gravada o de exportación
2. CPE electrónico que cumpla requisitos
3. RUC del proveedor activo y habilitado
4. Operación real y fehaciente
5. No estar en listas de deudores de SUNAT

RETENCIONES IGV (3%):
- Agentes designados mediante Resolución de Superintendencia
- Operaciones > S/ 700 (en la práctica) o > S/ 1,400 (formalmente)
- El agente retenedor descuenta el 3% del IGV y lo entrega a SUNAT

PERCEPCIONES IGV:
- Percepción en importación: 3.5% (10% si bien es usado)
- Percepción en venta de combustible: 1% (hasta 2026)
- Percepción en venta de bienes: 2% (designados por SUNAT)

OPERACIONES EXONERADAS (tasa 0%):
Productos alimenticios básicos, educación, salud (seguros), transporte público,
servicios funerarios, espectáculos culturales (condiciones específicas).`,
	tags: ["igv", "tributos", "credito-fiscal", "retenciones"],
	modelHint: "strict",
};
