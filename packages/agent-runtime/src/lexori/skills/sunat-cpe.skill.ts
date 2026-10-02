import type { LexoriSkillDefinition } from "../../_domain-types/domain-barrel";

/**
 * SUNAT CPE — Comprobantes de Pago Electrónicos
 * Facturación electrónica, series, montos mínimos, plazos de envío.
 */
export const sunatCpeSkill: LexoriSkillDefinition = {
	id: "sunat-cpe",
	name: "SUNAT Comprobantes Electrónicos",
	category: "sunat-cpe",
	description:
		"Reglas de facturación electrónica SUNAT: series, IGV, detracciones, plazos de envío",
	version: "2026.1",
	rules: [
		{
			id: "cpe-serie-formato",
			description:
				"Series F001 (factura), B001 (boleta), R001 (nota de crédito), RC01 (nota de débito) — cada tipo tiene su prefijo",
		},
		{
			id: "cpe-igv-calculo",
			description:
				"IGV = 18% (16% impuesto + 2% IPM). Monto base = valor venta sin IGV. Total = base + IGV",
		},
		{
			id: "cpe-envio-plazo",
			description:
				"Enviar CDR a SUNAT dentro de 7 días calendario de la emisión. Emitir como máximo 7 días después de la operación",
		},
		{
			id: "cpe-monto-minimo-boleta",
			description:
				"Boletas: no dan derecho a crédito fiscal. Facturas: sí. Monto mínimo para obligatoriedad electrónica: 1 UIT",
		},
		{
			id: "cpe-baja",
			description:
				"Anulación: nota de crédito dentro del período o comunicación de baja dentro de 7 días",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: SUNAT CPE - Comprobantes Electrónicos]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Ley N° 25632 (Ley de Comprobantes de Pago) y modificatorias
- Resolución de Superintendencia N° 300-2014/SUNAT (Sistema de Emisión Electrónica)
- Decreto Legislativo N° 1535 (Digitalización de comprobantes)

REGLA 1 — SERIES ELECTRÓNICAS:
Cada tipo de comprobante usa su propio prefijo de serie:
- Factura → F001
- Boleta → B001
- Nota de Crédito → R001 / FC01 (según tipo)
- Nota de Débito → RC01 / FD01
- Guía de Remisión → T001

REGLA 2 — IGV (18%):
Base imponible × 0.18 = IGV. Siempre verificar que "total = base + IGV" cuadre exactamente.
Si el cliente es Régimen MYPE Tributario (RMT), verificar tasa reducida aplicable.

REGLA 3 — PLAZOS SUNAT:
- Enviar CDR: máximo 7 días calendario desde emisión
- Fecha de emisión: máximo 7 días desde la operación real
- Comunicación de baja: 7 días desde emisión del comprobante

REGLA 4 — CRÉDITO FISCAL:
Sólo facturas (no boletas) dan derecho a crédito fiscal IGV.
Requisitos: RUC válido en SUNAT, operación real, destinado a operación gravada.

REGLA 5 — ANULACIONES:
Nota de Crédito (anula parcial/total): debe referenciar el CPE original.
Comunicación de baja: solo para CPEs no aceptados por el receptor.

{ruc} debe tener RUC activo y habilitado para emisión electrónica.`,
	tags: ["sunat", "cpe", "facturacion", "comprobantes"],
	modelHint: "strict",
};
