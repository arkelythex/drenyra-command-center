/**
 * SUNAT 2026 Knowledge Base — Seed Data
 *
 * Normas tributarias vigentes al 2026-01-01, Perú.
 * Sources: SUNAT, MEF, El Peruano (normas legales).
 *
 * Categories: igv, detraccion, sire, ruc, bancarizacion, pcge, uit, retencion, percepcion
 */

import type { NewSunatKnowledgeChunk } from "@arkelythex/persistence/schema";

/**
 * SUNAT_2026_SEED const.
 *
 * @example
 * ```ts
 * console.log(SUNAT_2026_SEED);
 * ```
 */
export const SUNAT_2026_SEED: NewSunatKnowledgeChunk[] = [
	// =====================================================================
	// IGV — Impuesto General a las Ventas
	// =====================================================================
	{
		id: "igv-001",
		source: "D.Leg. 775 / D.Leg. 1520",
		documentType: "DECRETO_LEGISLATIVO",
		title: "Tasa IGV — Impuesto General a las Ventas 18%",
		content:
			"La tasa del Impuesto General a las Ventas es del 16% más el 2% del Impuesto de Promoción Municipal (IPM), sumando un total del 18% sobre el valor de venta. Fórmula: IGV = Base Imponible × 0.18. Total = Base Imponible + IGV. Tolerancia de cálculo: ±S/ 2.00 por redondeo. El IGV grava la venta de bienes, prestación de servicios, contratos de construcción, primera venta de inmuebles por el constructor, e importación de bienes.",
		category: "igv",
		section: "Artículo 17",
		effectiveDate: "1994-01-01",
	},
	{
		id: "igv-002",
		source: "D.Leg. 1520",
		documentType: "DECRETO_LEGISLATIVO",
		title: "Crédito Fiscal IGV — Requisitos y Condiciones",
		content:
			"El crédito fiscal está constituido por el IGV consignado separadamente en el comprobante de pago que respalde la adquisición de bienes, servicios, contratos de construcción o el pago en la importación del bien. Requisito sustancial: que sean permitidos como gasto o costo de la empresa según la LIR. Requisito formal: que se destinen a operaciones gravadas con el impuesto. Los comprobantes deben cumplir con los requisitos del Reglamento de Comprobantes de Pago (RCP).",
		category: "igv",
		section: "Artículo 18 y 19",
		effectiveDate: "2021-01-01",
	},
	{
		id: "igv-003",
		source: "RS-000005-2026/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "SIRE — IGV Consistencia RVIE/RCE con PLE",
		content:
			"La SUNAT verificará la consistencia entre los registros del SIRE (RVIE y RCE) y el Programa de Libros Electrónicos (PLE). Una diferencia de cero comprobantes entre RVIE y ventas PLE, o entre RCE y compras PLE, indica consistencia perfecta. Cualquier brecha (gap) en el número de registros activa alerta de inconsistencia CPE y requiere conciliación previa a la presentación del período. Código de alerta: SUNAT_AI_CPE_INCONSISTENCY.",
		category: "sire",
		section: "Artículo 4",
		effectiveDate: "2026-01-01",
	},

	// =====================================================================
	// DETRACCIONES (SPOT)
	// =====================================================================
	{
		id: "detraccion-001",
		source: "D.Leg. 940 / RS 183-2004/SUNAT",
		documentType: "DECRETO_LEGISLATIVO",
		title: "SPOT — Sistema de Pago de Obligaciones Tributarias (Detracciones)",
		content:
			"El Sistema de Pago de Obligaciones Tributarias (SPOT) obliga al comprador o usuario a descontar un porcentaje del precio de venta y depositarlo en la cuenta de detracciones del vendedor en el Banco de la Nación. Los montos depositados solo pueden ser utilizados por el titular para el pago de sus tributos y contribuciones administradas por la SUNAT. El incumplimiento genera multa del 50% del monto no depositado (Infracción Código Tributario Art. 12 Num. 1).",
		category: "detraccion",
		section: "Artículo 1-3",
		effectiveDate: "2004-07-15",
	},
	{
		id: "detraccion-002",
		source: "RS 183-2004/SUNAT y modificatorias / RS 071-2018/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "Tasas de Detracción SPOT 2026 — Servicios y Bienes",
		content:
			"Tasas de detracción vigentes al 2026: (1) Servicios gravados con IGV (Anexo 3): 12% cuando el importe supera S/ 700. (2) Servicios de intermediación laboral y tercerización: 12%. (3) Arrendamiento de bienes muebles e inmuebles: 12%. (4) Contratos de construcción: 4%. (5) Servicios de mantenimiento y reparación: 12%. (6) Transporte de bienes por vía terrestre: 4%. Umbral mínimo para aplicar SPOT en servicios: S/ 700 por operación. El porcentaje aplica sobre el precio de venta total (incluido IGV).",
		category: "detraccion",
		section: "Anexo 3",
		effectiveDate: "2018-04-01",
	},
	{
		id: "detraccion-003",
		source: "RS 183-2004/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "SPOT — Bienes sujetos al 10% (Anexo 2)",
		content:
			"Bienes sujetos a detracción del 10% según Anexo 2: recursos hidrobiológicos, maíz amarillo duro, caña de azúcar, arena y piedra, residuos y desechos metálicos, chatarra, bienes del inciso A.2 del Apéndice I de la Ley del IGV, aceite de pescado, harina, polvo y pellets de pescado, embarcaciones pesqueras. La detracción aplica cuando el importe de la operación supera S/ 700 y el bien esté en el Anexo 2.",
		category: "detraccion",
		section: "Anexo 2",
		effectiveDate: "2018-04-01",
	},

	// =====================================================================
	// BANCARIZACIÓN
	// =====================================================================
	{
		id: "bancarizacion-001",
		source: "D.Leg. 1529 / Ley 28194",
		documentType: "DECRETO_LEGISLATIVO",
		title: "Bancarización — Obligación de Medios de Pago",
		content:
			"Las obligaciones que se cumplan mediante el pago de sumas de dinero cuyo importe sea superior a S/ 3,500 o $ 1,000 deben pagarse utilizando los medios de pago del sistema financiero: depósitos en cuenta, giros, transferencias de fondos, órdenes de pago, tarjetas de débito/crédito, cheques no negociables. El incumplimiento implica la pérdida del derecho al gasto/costo tributario y al crédito fiscal del IGV. Umbral 2026: S/ 3,500 (moneda nacional) o $ 1,000 (moneda extranjera).",
		category: "bancarizacion",
		section: "Artículo 3 y 4",
		effectiveDate: "2022-01-01",
	},
	{
		id: "bancarizacion-002",
		source: "Ley 28194 / D.Leg. 1529",
		documentType: "DECRETO_LEGISLATIVO",
		title: "Bancarización — Pérdida de Crédito Fiscal por Incumplimiento",
		content:
			"Cuando se paga en efectivo una operación superior a S/ 3,500 sin usar medios de pago, el adquirente pierde: (1) el derecho a deducir como gasto o costo el importe pagado en el Impuesto a la Renta, (2) el crédito fiscal del IGV. La SUNAT puede detectar estos pagos mediante la comparación entre los asientos contables y los estados de cuenta bancarios. Infracción aplicable: Artículo 178 numeral 1 del Código Tributario.",
		category: "bancarizacion",
		section: "Artículo 8",
		effectiveDate: "2022-01-01",
	},

	// =====================================================================
	// SIRE — Sistema Integrado de Registros Electrónicos
	// =====================================================================
	{
		id: "sire-001",
		source: "RS-000005-2026/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "SIRE — Obligatoriedad PRICOS desde junio 2026",
		content:
			"El SIRE (Sistema Integrado de Registros Electrónicos) es obligatorio para los PRICOS (Principales Contribuyentes) cuyo promedio de ingresos netos supere las 2,300 UIT (S/ 12,650,000 al 2026) a partir del período junio 2026 (vencimiento primer día hábil del mes siguiente). El SIRE reemplaza al PLE-Ventas y PLE-Compras. Los PRICOS deben generar el RVIE (Registro de Ventas e Ingresos Electrónico) y el RCE (Registro de Compras Electrónico) a través del portal de SUNAT o API SIRE. Clasificación PRICO: vigente al 31 de enero de 2026.",
		category: "sire",
		section: "Artículo 2",
		effectiveDate: "2026-01-01",
	},
	{
		id: "sire-002",
		source: "RS-000005-2026/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "SIRE — Período de Adaptación y Discrecionalidad SUNAT",
		content:
			"La RS NATI 000005-2026/SUNAT establece un período de adaptación de marzo a mayo 2026 (3 meses). Durante este período, la SUNAT ejercerá facultad discrecional respecto a infracciones relacionadas con el SIRE para PRICOS en proceso de implementación. Después del 1 de junio de 2026, el SIRE es obligatorio sin excepciones. La propuesta de RVIE/RCE generada por SUNAT puede ser: aceptada (sin cambios), complementada (agrega comprobantes no detectados) o sustituida (reemplaza completamente con el registro propio).",
		category: "sire",
		section: "Disposición Final 3",
		effectiveDate: "2026-03-01",
	},
	{
		id: "sire-003",
		source: "RS 000001-2024/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "SIRE — RVIE Plazos de Presentación",
		content:
			"El Registro de Ventas e Ingresos Electrónico (RVIE) debe presentarse hasta el décimo día calendario del mes siguiente al período tributario. Ejemplo: El RVIE de enero 2026 vence el 10 de febrero de 2026. Si el vencimiento cae en día inhábil, se traslada al día hábil siguiente. La presentación fuera de plazo genera multa del 0.3% de los ingresos netos del mes precedente (mínimo 10% UIT, máximo 12 UIT). La UIT 2026 es S/ 5,500.",
		category: "sire",
		section: "Artículo 6",
		effectiveDate: "2024-01-01",
	},

	// =====================================================================
	// RUC — Registro Único de Contribuyentes
	// =====================================================================
	{
		id: "ruc-001",
		source: "D.Leg. 943 / RS 210-2004/SUNAT",
		documentType: "DECRETO_LEGISLATIVO",
		title: "RUC — Algoritmo de Validación Módulo 11",
		content:
			"El RUC peruano tiene 11 dígitos. Validación por Módulo 11: (1) Multiplicar cada uno de los 10 primeros dígitos por los factores [5,4,3,2,7,6,5,4,3,2]. (2) Sumar los productos. (3) Dividir entre 11 y obtener el residuo. (4) Restar 11 menos el residuo. (5) Si el resultado es 10 → dígito verificador = 0; si es 11 → dígito verificador = 1; en los demás casos, el resultado ES el dígito verificador. El dígito 11 del RUC debe coincidir. RUC de persona natural empieza con '10'. RUC de empresa empieza con '20'.",
		category: "ruc",
		section: "Artículo 4",
		effectiveDate: "2004-11-01",
	},
	{
		id: "ruc-002",
		source: "D.Leg. 943",
		documentType: "DECRETO_LEGISLATIVO",
		title: "RUC — Estados y Condiciones",
		content:
			"Estado RUC: ACTIVO (operaciones normales), BAJA DE OFICIO (SUNAT lo da de baja), BAJA PROVISIONAL (suspensión temporal), BAJA DEFINITIVA. Condición RUC: HABIDO (dirección fiscal verificada por SUNAT), NO HABIDO (SUNAT no pudo verificar la dirección), NO HALLADO (en proceso de verificación). Solo se puede emitir comprobantes de pago con RUC estado ACTIVO y condición HABIDO. Emitir con RUC NO HABIDO genera multa y nulidad del comprobante.",
		category: "ruc",
		section: "Artículo 12",
		effectiveDate: "2004-11-01",
	},

	// =====================================================================
	// UIT — Unidad Impositiva Tributaria
	// =====================================================================
	{
		id: "uit-001",
		source: "DS 009-2024-EF",
		documentType: "DECRETO_SUPREMO",
		title: "UIT 2026 — S/ 5,500",
		content:
			"La Unidad Impositiva Tributaria (UIT) para el ejercicio 2026 es S/ 5,500 (cinco mil quinientos soles), según Decreto Supremo N° 009-2024-EF publicado en El Peruano el 15 de enero de 2024. La UIT se usa como referencia para: umbrales de obligatoriedad SIRE (2,300 UIT = S/ 12,650,000), multas tributarias (porcentajes de UIT), tramos de retención de quinta categoría, entre otros. UIT 2025: S/ 5,350. UIT 2024: S/ 5,150.",
		category: "uit",
		section: "Artículo 1",
		effectiveDate: "2026-01-01",
	},

	// =====================================================================
	// RETENCIONES
	// =====================================================================
	{
		id: "retencion-001",
		source: "RS 037-2002/SUNAT / RS 135-2002/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "Régimen de Retenciones del IGV — Tasa 3%",
		content:
			"El Régimen de Retenciones del IGV obliga a los Agentes de Retención designados por SUNAT a retener el 3% del importe total de las operaciones gravadas con IGV superiores a S/ 700 (incluido el impuesto). El importe retenido se entrega al fisco mediante formulario PDT 626. El proveedor puede usar el monto retenido como crédito contra su IGV por pagar. Los Agentes de Retención están designados en una lista publicada por SUNAT en su portal web. La no retención genera multa al agente.",
		category: "retencion",
		section: "Artículo 1 y 3",
		effectiveDate: "2002-04-01",
	},

	// =====================================================================
	// PERCEPCIONES
	// =====================================================================
	{
		id: "percepcion-001",
		source: "Ley 29173 / RS 058-2006/SUNAT",
		documentType: "RESOLUCION_SUNAT",
		title: "Régimen de Percepciones del IGV — Importaciones y Venta Interna",
		content:
			"El Régimen de Percepciones del IGV aplica en: (1) Importación de bienes: 3.5% sobre el CIF (Costo + Seguro + Flete) para bienes del Apéndice 1; (2) Adquisición de combustibles: 1% sobre el precio de venta; (3) Venta interna de bienes: 2% sobre el precio de venta para agentes de percepción designados. El importe percibido se puede usar como crédito contra el IGV. Si existe exceso, puede aplicarse a otras deudas o solicitarse devolución.",
		category: "percepcion",
		section: "Artículo 2",
		effectiveDate: "2006-04-01",
	},

	// =====================================================================
	// PCGE — Plan Contable General Empresarial
	// =====================================================================
	{
		id: "pcge-001",
		source: "RS CNC 002-2019-EF/30",
		documentType: "RESOLUCION_SUNAT",
		title: "PCGE 2019 — Cuenta 4011 IGV por Pagar",
		content:
			"Cuenta 4011 — Impuesto General a las Ventas: Registra el IGV generado en las ventas (IGV débito fiscal). Subcuentas: 40111 IGV — Cuenta propia (ventas propias), 40112 IGV — Liquidación de compra, 40113 IGV — Operaciones en consignación. El saldo acreedor representa el IGV a pagar. El saldo deudor en 4011 puede indicar error contable o crédito fiscal mayor al débito. El asiento de cierre mensual debe conciliar con el PDT 621 presentado a SUNAT. Cuenta relacionada: 4012 — Retenciones y percepciones del IGV.",
		category: "pcge",
		section: "Elemento 4, Cuenta 40",
		effectiveDate: "2020-01-01",
	},
	{
		id: "pcge-002",
		source: "RS CNC 002-2019-EF/30",
		documentType: "RESOLUCION_SUNAT",
		title: "PCGE 2019 — Cuenta 4017 Impuesto a la Renta por Pagar",
		content:
			"Cuenta 4017 — Impuesto a la Renta: Registra el Impuesto a la Renta (IR) determinado y por pagar. Subcuentas: 40171 Tercera categoría (renta de negocios — tasa 29.5% para régimen general), 40172 Cuarta categoría (rentas del trabajo independiente), 40173 Quinta categoría (rentas del trabajo dependiente). Los pagos a cuenta mensuales (coeficiente o porcentaje 1.5%) se registran debitando esta cuenta. La regularización anual se hace al presentar la DJ Anual de Renta.",
		category: "pcge",
		section: "Elemento 4, Cuenta 40",
		effectiveDate: "2020-01-01",
	},
];
