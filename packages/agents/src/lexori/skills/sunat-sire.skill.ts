import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

export const sunatSireSkill: LexoriSkillDefinition = {
	id: "sunat-sire",
	name: "SUNAT SIRE — Registros Electrónicos",
	category: "sunat-sire",
	description:
		"Sistema Integrado de Registros Electrónicos: REP, REC, LDI y plazos de presentación",
	version: "2026.1",
	rules: [
		{
			id: "sire-rep-formato",
			description:
				"REP (Registro de Ventas e Ingresos): libro electrónico de ingresos, obligatorio desde 2024 ampliación",
		},
		{
			id: "sire-rec-formato",
			description:
				"REC (Registro de Compras): libro electrónico de adquisiciones, formato 8.1 estándar SUNAT",
		},
		{
			id: "sire-ldi-formato",
			description:
				"LDI (Libro Diario de Formato Simplificado): para empresas del Régimen General con ingresos < 300 UIT",
		},
		{
			id: "sire-plazos",
			description:
				"Plazos de presentación mensual según dígito RUC, primer dígito = día hábil",
		},
		{
			id: "sire-rectificatoria",
			description:
				"Rectificatoria: dentro del mismo período (sustitutoria) o fuera (con cargos y moras)",
		},
	],
	contextTemplate: `[MARCO REGULATORIO: SUNAT SIRE - Registros Electrónicos]
RUC: {ruc} | Período: {periodo}

NORMAS APLICABLES:
- Resolución de Superintendencia N° 000009-2024/SUNAT (Reglamento SIRE)
- Ley N° 28194 (Ley de Registros Electrónicos)

LIBROS OBLIGATORIOS POR RÉGIMEN:

REP (Registro de Ventas e Ingresos):
- Obligatorio para todos los contribuyentes del Régimen General y RMT
- Incluye: CPE emitidos, notas de crédito/débito, exportaciones
- Periodicidad: mensual

REC (Registro de Compras):
- Obligatorio para todos los contribuyentes con derecho a crédito fiscal
- Incluye: CPE recibidos, notas de crédito/débito recibidos, importaciones
- Periodicidad: mensual

LDI (Libro Diario de Formato Simplificado):
- Empresas Régimen General con ingresos < 300 UIT (≈ S/ 1,537,500 para 2026)
- Empresas RMT con ingresos < 1700 UIT (≈ S/ 8,712,500 para 2026)

PLAZOS DE PRESENTACIÓN:
El día hábil de presentación se determina por el primer dígito del RUC:
- 0: día hábil 1 | 1: día hábil 2 | 2: día hábil 3
- 3: día hábil 5 | 4: día hábil 6 | 5: día hábil 5
- 6: día hábil 7 | 7: día hábil 8 | 8: día hábil 9
- 9: día hábil 10

RECTIFICATORIAS:
- Dentro del mismo período: rectificación sustitutoria (sin costo)
- Período siguiente: rectificación con declaración adicional (intereses moratorios)

VALIDACIÓN SIRE:
Cada registro debe tener: CPE válido, RUC del emisor activo, montos con dos decimales,
IGV consistente con tasa 18%,
base imponible = total / 1.18 para operaciones gravadas.`,
	tags: ["sunat", "sire", "registros", "rep", "rec", "ldi"],
	modelHint: "strict",
};
