import type { LexoriSkillDefinition } from "../../_domain-types/domain-barrel";

export const fiscalRetentionsSkill: LexoriSkillDefinition = {
	id: "fiscal-retentions",
	name: "Fiscal Retenciones — IR Cuarta y Quinta",
	category: "fiscal-retentions",
	description:
		"Retenciones del Impuesto a la Renta: Cuarta Categoría (8% + 4% ESSALUD), Quinta Categoría (escala progresiva), tasas y plazos",
	version: "2026.1",
	rules: [
		{
			id: "renta-cuarta-tasa",
			description:
				"Cuarta Categoría: 8% de retención. Base = honorarios brutos. Si el recibo supera S/ 1,500, aplicar retención",
		},
		{
			id: "renta-quinta-escala",
			description:
				"Quinta Categoría: escala progresiva 8%, 14%, 17%, 20%, 30% sobre renta neta anual >= 7 UIT",
		},
		{
			id: "renta-plazos-retencion",
			description:
				"Plazos de depósito: 5 primeros días del mes siguiente. DJ anual: hasta marzo del siguiente ejercicio",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: RETENCIONES IR]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Ley del Impuesto a la Renta (TUO D.S. 179-2004-EF)
- Reglamento de Retenciones y Percepciones

CUARTA CATEGORÍA (trabajadores independientes):
- Tasa: 8% sobre el monto bruto del recibo por honorarios
- Monto mínimo para retener: S/ 1,500 por recibo
- Plazo de depósito: 5 primeros días hábiles del mes siguiente
- Se aplica por cada recibo individual, no es acumulativo mensual
- ESSALUD: 4% adicional (al iniciar actividades / afiliación)

QUINTA CATEGORÍA (trabajadores dependientes):
- Escala progresiva anual:
  - Hasta 7 UIT (≈ S/ 35,875 para 2026): 8%
  - Más de 7 UIT hasta 14 UIT: 14%
  - Más de 14 UIT hasta 20 UIT: 17%
  - Más de 20 UIT hasta 30 UIT: 20%
  - Más de 30 UIT hasta 45 UIT: 30%
  - Más de 45 UIT: 30%
- El empleador retiene mensualmente y deposita
- Plazo: 5 primeros días hábiles del mes siguiente

EXCEPCIONES:
- Rentas de Quinta Categoría: no tienen retención si el trabajador
  declara tener otro empleador principal
- Cuarta Categoría: si el independiente tiene ingresos < S/ 34,260/año
  (7 UIT), no está obligado a declarar

DOCUMENTACIÓN:
- Cuarta: Recibo por Honorarios Electrónico (RHE)
- Quinta: Planilla de pagos y boletas de pago`,
	tags: ["renta", "retenciones", "cuarta-categoria", "quinta-categoria", "ir"],
	modelHint: "analytical",
};
