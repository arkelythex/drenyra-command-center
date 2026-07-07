# P0 — Lexori Reconnect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconnect the disconnected Lexori regulatory context pipeline — agents eviden, vigila, traza, and numina currently execute fiscal operations without any regulatory context injected into their prompts.

**Architecture:** Create 6 LexoriSkillDefinition instances with substantive Peruvian fiscal regulation templates, a LexoriSkillResolver that maps agent IDs to applicable skill categories, and integrate it into DrenyraOrchestrator.handleInput() so every fiscal agent dispatch carries rendered regulatory context in the OrchestrationResult.

**Tech Stack:** Bun + TypeScript + Vitest. Purely additive: no existing code changed except orchestrator constructor and handleInput return type. Renders use `renderLexoriSkillContext` from `@drenyra/domain/drenyra`.

## Global Constraints

- All new files go in `packages/agents/src/lexori/` — clean module boundary
- Use `renderLexoriSkillContext` from `@drenyra/domain/drenyra` (already in dependencies)
- `LexoriSkillDefinition` interface from `@drenyra/domain/drenyra` — import type only
- Agent-to-skill mapping: eviden → [sunat-cpe, sunat-sire], vigila → [fiscal-igv, fiscal-detractions, fiscal-retentions], traza → [sunat-sire, niif-pcge], numina → [niif-pcge]
- No UI changes, no route changes — pure backend module
- All context templates in Spanish (Peruvian fiscal domain)
- OrchestrationResult gets new optional field: `lexoriContext?: LexoriSkillContextResult[]`
- DrenyraOrchestrator constructor gets optional 4th param: `lexoriProvider?: LexoriSkillResolver`

---
### Task 1: Lexori skill definitions + resolver module

**Files:**
- Create: `packages/agents/src/lexori/skills/sunat-cpe.skill.ts`
- Create: `packages/agents/src/lexori/skills/sunat-sire.skill.ts`
- Create: `packages/agents/src/lexori/skills/niif-pcge.skill.ts`
- Create: `packages/agents/src/lexori/skills/fiscal-igv.skill.ts`
- Create: `packages/agents/src/lexori/skills/fiscal-detractions.skill.ts`
- Create: `packages/agents/src/lexori/skills/fiscal-retentions.skill.ts`
- Create: `packages/agents/src/lexori/skills/index.ts`
- Create: `packages/agents/src/lexori/lexori.resolver.ts`
- Create: `packages/agents/src/lexori/index.ts`
- Modify: `packages/agents/src/index.ts` — add `export * from "./lexori"`
- Create: `packages/agents/src/lexori/__tests__/lexori.resolver.test.ts`

**Interfaces:**
- Consumes: `LexoriSkillDefinition`, `LexoriSkillCategory`, `LEXORI_SKILL_CATEGORY`, `renderLexoriSkillContext`, `LexoriSkillContextResult` from `@drenyra/domain/drenyra`
- Produces: `LexoriSkillResolver` class with `resolveForAgent(agentId: string, variables: Record<string, string>): Promise<LexoriSkillContextResult[]>` method + 6 named skill definition exports

---
#### Task 1 Steps

- [ ] **Step 1: Create `packages/agents/src/lexori/skills/sunat-cpe.skill.ts`**

```typescript
import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

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
```

- [ ] **Step 2: Create `packages/agents/src/lexori/skills/sunat-sire.skill.ts`**

```typescript
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
```

- [ ] **Step 3: Create `packages/agents/src/lexori/skills/niif-pcge.skill.ts`**

```typescript
import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

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
```

- [ ] **Step 4: Create `packages/agents/src/lexori/skills/fiscal-igv.skill.ts`**

```typescript
import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

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
```

- [ ] **Step 5: Create `packages/agents/src/lexori/skills/fiscal-detractions.skill.ts`**

```typescript
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
```

- [ ] **Step 6: Create `packages/agents/src/lexori/skills/fiscal-retentions.skill.ts`**

```typescript
import type { LexoriSkillDefinition } from "@drenyra/domain/drenyra";

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
```

- [ ] **Step 7: Create `packages/agents/src/lexori/skills/index.ts`**

```typescript
export { sunatCpeSkill } from "./sunat-cpe.skill";
export { sunatSireSkill } from "./sunat-sire.skill";
export { niifPcgeSkill } from "./niif-pcge.skill";
export { fiscalIgvSkill } from "./fiscal-igv.skill";
export { fiscalDetractionsSkill } from "./fiscal-detractions.skill";
export { fiscalRetentionsSkill } from "./fiscal-retentions.skill";
```

- [ ] **Step 8: Write the resolver test first**

Create `packages/agents/src/lexori/__tests__/lexori.resolver.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { LexoriSkillResolver } from "../lexori.resolver";

describe("LexoriSkillResolver", () => {
	const resolver = new LexoriSkillResolver();

	it("resolves context for eviden agent (SUNAT CPE + SIRE)", async () => {
		const result = await resolver.resolveForAgent("eviden", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(2);
		const categories = result.map((r) => r.category);
		expect(categories).toContain("sunat-cpe");
		expect(categories).toContain("sunat-sire");
		for (const ctx of result) {
			expect(ctx.renderedContext).toContain("20123456789");
			expect(ctx.renderedContext).toContain("2026-06");
			expect(ctx.version).toBe("2026.1");
		}
	});

	it("resolves context for vigila agent (IGV + detractions + retentions)", async () => {
		const result = await resolver.resolveForAgent("vigila", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(3);
		const categories = result.map((r) => r.category);
		expect(categories).toContain("fiscal-igv");
		expect(categories).toContain("fiscal-detractions");
		expect(categories).toContain("fiscal-retentions");
	});

	it("resolves context for traza agent (SIRE + NIIF)", async () => {
		const result = await resolver.resolveForAgent("traza", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(2);
		expect(result[0].category).toBe("sunat-sire");
		expect(result[1].category).toBe("niif-pcge");
	});

	it("resolves context for numina agent (NIIF only)", async () => {
		const result = await resolver.resolveForAgent("numina", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toHaveLength(1);
		expect(result[0].category).toBe("niif-pcge");
	});

	it("returns empty array for unknown agent", async () => {
		const result = await resolver.resolveForAgent("unknown", {
			ruc: "20123456789",
			periodo: "2026-06",
		});
		expect(result).toEqual([]);
	});
});
```

- [ ] **Step 9: Create resolver implementation**

Create `packages/agents/src/lexori/lexori.resolver.ts`:

```typescript
import {
	sunatCpeSkill,
	sunatSireSkill,
	niifPcgeSkill,
	fiscalIgvSkill,
	fiscalDetractionsSkill,
	fiscalRetentionsSkill,
} from "./skills/index";
import type { LexoriSkillDefinition, LexoriSkillContextResult } from "@drenyra/domain/drenyra";
import { renderLexoriSkillContext } from "@drenyra/domain/drenyra";

/**
 * Maps agent IDs to their applicable Lexori fiscal skill categories.
 *
 * eviden → SUNAT CPE + SIRE (comprobantes y registros)
 * vigila → IGV + detracciones + retenciones (tributos)
 * traza  → SIRE + NIIF (trazabilidad contable-fiscal)
 * numina → NIIF (contabilidad general)
 */
const AGENT_SKILL_MAP: Record<string, LexoriSkillDefinition[]> = {
	eviden: [sunatCpeSkill, sunatSireSkill],
	vigila: [fiscalIgvSkill, fiscalDetractionsSkill, fiscalRetentionsSkill],
	traza: [sunatSireSkill, niifPcgeSkill],
	numina: [niifPcgeSkill],
};

/**
 * Resolves Lexori regulatory context for a target agent.
 *
 * Injected as optional dependency into DrenyraOrchestrator.
 * Each skill definition is rendered with case variables (RUC, periodo, etc.)
 * to produce a complete regulatory context block for the agent.
 */
export class LexoriSkillResolver {
	/**
	 * Resolve and render all applicable skill contexts for the given agent.
	 * Returns an empty array if the agent has no registered skills.
	 */
	async resolveForAgent(
		agentId: string,
		variables: Record<string, string>,
	): Promise<LexoriSkillContextResult[]> {
		const skills = AGENT_SKILL_MAP[agentId];
		if (!skills) return [];

		return skills.map((skill) => renderLexoriSkillContext(skill, variables));
	}
}
```

- [ ] **Step 10: Create barrel export**

Create `packages/agents/src/lexori/index.ts`:

```typescript
export { LexoriSkillResolver } from "./lexori.resolver";
export {
	sunatCpeSkill,
	sunatSireSkill,
	niifPcgeSkill,
	fiscalIgvSkill,
	fiscalDetractionsSkill,
	fiscalRetentionsSkill,
} from "./skills/index";
```

- [ ] **Step 11: Update packages/agents/src/index.ts**

Add after existing exports:
```typescript
export * from "./lexori";
```

- [ ] **Step 12: Run tests**

```bash
bun test packages/agents/src/lexori/__tests__/lexori.resolver.test.ts --root packages/agents
```
Expected: 5/5 passing. Verify with:
```bash
bun test --root packages/agents
```
Expected: existing tests still pass, total count = previous + 5.

- [ ] **Step 13: Commit**

```bash
cd ~/Documents/PROYECTOS/Drenyra && git add packages/agents/src/lexori/ packages/agents/src/index.ts && git commit -m "feat(agents): add Lexori skill definitions and resolver module"
```

---
### Task 2: Integrate Lexori into DrenyraOrchestrator

**Files:**
- Modify: `packages/agents/src/mastra/orchestrator.ts` — constructor + handleInput + type
- No changes needed to callers (result shape is additive, not breaking)

**Interfaces:**
- Consumes: `LexoriSkillResolver` from `../lexori/lexori.resolver`
- Produces: `OrchestrationResult` with new optional `lexoriContext` field

---

- [ ] **Step 1: Extend `OrchestrationResult` type**

Add `lexoriContext` as optional field to the existing interface:
```typescript
export interface OrchestrationResult {
    sessionId: string;
    intent: AgentIntent;
    result:
        | { success: boolean; data: unknown }
        | { success: boolean; error: string };
    agent: string;
    /** Lexori regulatory context injected for fiscal agents, if resolver is configured */
    lexoriContext?: LexoriSkillContextResult[];
}
```

- [ ] **Step 2: Add `lexoriProvider` to constructor**

Add as 4th optional parameter:
```typescript
constructor(
    approvalGate: ApprovalGateEngine,
    eventBus: AgentEventBus,
    detectIntent: IntentHandler,
    private readonly lexoriProvider?: LexoriSkillResolver,
) { ... }
```

- [ ] **Step 3: Resolve Lexori context in `handleInput`**

After the agent lookup succeeds (line ~108-109 of current orchestrator.ts), before the eventBus.publish call, add:

```typescript
// Resolve Lexori regulatory context for fiscal agents
let lexoriContext: LexoriSkillContextResult[] | undefined;
if (this.lexoriProvider) {
    lexoriContext = await this.lexoriProvider.resolveForAgent(intent.agent, {
        ruc: context.ruc ?? "",
        periodo: context.periodo ?? "",
    });
}
```

Then include `lexoriContext` in the return value:
```typescript
return {
    sessionId: actualSessionId,
    intent,
    result: { success: true, data: { agent: agent.id, intent: intent.tool, input } },
    agent: intent.agent,
    lexoriContext,
};
```

- [ ] **Step 4: Verify typecheck**

```bash
bun run typecheck --root packages/agents
```
Expected: 0 new errors. 2 pre-existing errors in monthly-close (unrelated).

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/PROYECTOS/Drenyra && git add packages/agents/src/mastra/orchestrator.ts && git commit -m "feat(orchestrator): inject Lexori context into OrchestrationResult for fiscal agents"
```

---
### Task 3: Wire Lexori provider in factory + verify end-to-end

**Files:**
- Modify: `packages/agents/src/mastra/orchestrator.ts` — `createDrenyraOrchestrator` factory

---

- [ ] **Step 1: Update `createDrenyraOrchestrator` to include Lexori**

Add `withLexori?: boolean` to options and instantiate `LexoriSkillResolver`:

```typescript
export function createDrenyraOrchestrator(
    options: {
        governanceValidator?: (...);
        notifyCallback?: (...);
        swarmMode?: "flat" | "hierarchy";
        withLexori?: boolean;
    } = {},
): {
    orchestrator: DrenyraOrchestrator;
    approvalStore: ApprovalStore;
    approvalGate: ApprovalGateEngine;
    eventBus: AgentEventBus;
    intentDetector: IntentDetector;
    latinOrchestrator?: LatinModernoOrchestrator;
    lexoriResolver?: LexoriSkillResolver;
} {
    // existing setup...
    
    const lexoriResolver = options.withLexori ? new LexoriSkillResolver() : undefined;
    
    const orchestrator = new DrenyraOrchestrator(
        approvalGate,
        eventBus,
        (input: string, context: AgentContext) =>
            intentDetector.detectIntent(input, context),
        lexoriResolver,  // pass as 4th param
    );
    
    return {
        orchestrator,
        approvalStore,
        approvalGate,
        eventBus,
        intentDetector,
        latinOrchestrator,
        lexoriResolver,
    };
}
```

- [ ] **Step 2: Verify typecheck + tests**

```bash
bun run typecheck --root packages/agents
bun test --root packages/agents
```
Expected: 0 type errors, all existing tests pass.

- [ ] **Step 3: Quick integration smoke test**

Run the resolver test to confirm end-to-end rendering works:
```bash
bun test packages/agents/src/lexori/__tests__/lexori.resolver.test.ts --root packages/agents
```
Expected: 5/5 passing.

- [ ] **Step 4: Commit**

```bash
cd ~/Documents/PROYECTOS/Drenyra && git add packages/agents/src/mastra/orchestrator.ts && git commit -m "feat(orchestrator): wire LexoriSkillResolver in createDrenyraOrchestrator factory"
```
