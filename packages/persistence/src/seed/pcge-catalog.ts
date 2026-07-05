/**
 * PCGE Catalog Seed
 *
 * Plan Contable General Empresarial — Peruvian chart of accounts.
 * This seed populates the full PCGE catalog idempotently.
 *
 * Structure:
 * - Elemento 1: Activo Disponible y Exigible
 * - Elemento 2: Activo Realizable
 * - Elemento 3: Activo Inmovilizado
 * - Elemento 4: Pasivo
 * - Elemento 5: Patrimonio Neto
 * - Elemento 6: Gastos por Naturaleza
 * - Elemento 7: Ingresos
 * - Elemento 8: Saldos Intermediarios de Gestión
 * - Elemento 9: Costos de Producción
 */

import { pcgeAccounts } from "../schema/accounting.schema";

interface PcgeAccountInput {
	code: string;
	name: string;
	level: string;
	type:
		| "Activo"
		| "Pasivo"
		| "Patrimonio"
		| "Ingreso"
		| "Gasto"
		| "Costo"
		| "Saldo";
	parentCode?: string;
}

// Helper to generate parentId lookup map after first pass
const PCGE_CATALOG: PcgeAccountInput[] = [
	// ========== ELEMENTO 1: ACTIVO DISPONIBLE Y EXIGIBLE ==========
	{
		code: "10",
		name: "Efectivo y Equivalentes de Efectivo",
		level: "2",
		type: "Activo",
	},
	{ code: "101", name: "Caja", level: "3", type: "Activo", parentCode: "10" },
	{
		code: "102",
		name: "Fondo Fijo",
		level: "3",
		type: "Activo",
		parentCode: "10",
	},
	{
		code: "104",
		name: "Cuentas Corrientes en Instituciones Financieras",
		level: "3",
		type: "Activo",
		parentCode: "10",
	},
	{
		code: "105",
		name: "Depósitos de Ahorro",
		level: "3",
		type: "Activo",
		parentCode: "10",
	},
	{
		code: "106",
		name: "Depósitos a Plazo",
		level: "3",
		type: "Activo",
		parentCode: "10",
	},
	{
		code: "107",
		name: "Fondos Sujetos a Restricción",
		level: "3",
		type: "Activo",
		parentCode: "10",
	},

	{ code: "11", name: "Inversiones Financieras", level: "2", type: "Activo" },
	{
		code: "111",
		name: "Inversiones Financieras - Costo",
		level: "3",
		type: "Activo",
		parentCode: "11",
	},
	{
		code: "112",
		name: "Inversiones Financieras - Valor Razonable",
		level: "3",
		type: "Activo",
		parentCode: "11",
	},

	{
		code: "12",
		name: "Cuentas por Cobrar Comerciales - Terceros",
		level: "2",
		type: "Activo",
	},
	{
		code: "121",
		name: "Facturas por Cobrar Emitidas",
		level: "3",
		type: "Activo",
		parentCode: "12",
	},
	{
		code: "122",
		name: "Boletas por Cobrar Emitidas",
		level: "3",
		type: "Activo",
		parentCode: "12",
	},
	{
		code: "123",
		name: "Notas de Crédito por Cobrar",
		level: "3",
		type: "Activo",
		parentCode: "12",
	},
	{
		code: "124",
		name: "Otras Cuentas por Cobrar Comerciales",
		level: "3",
		type: "Activo",
		parentCode: "12",
	},

	{
		code: "13",
		name: "Cuentas por Cobrar Comerciales - Relacionadas",
		level: "2",
		type: "Activo",
	},
	{
		code: "131",
		name: "Facturas por Cobrar a Entidades Relacionadas",
		level: "3",
		type: "Activo",
		parentCode: "13",
	},
	{
		code: "132",
		name: "Otras Cuentas por Cobrar a Entidades Relacionadas",
		level: "3",
		type: "Activo",
		parentCode: "13",
	},

	{
		code: "14",
		name: "Cuentas por Cobrar al Personal y Accionistas",
		level: "2",
		type: "Activo",
	},
	{
		code: "141",
		name: "Préstamos al Personal",
		level: "3",
		type: "Activo",
		parentCode: "14",
	},
	{
		code: "142",
		name: "Préstamos a Accionistas",
		level: "3",
		type: "Activo",
		parentCode: "14",
	},

	{
		code: "16",
		name: "Cuentas por Cobrar Diversas - Terceros",
		level: "2",
		type: "Activo",
	},
	{
		code: "161",
		name: "Reclamaciones a Terceros",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},
	{
		code: "162",
		name: "Depósitos en Garantía",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},
	{
		code: "163",
		name: "Cuentas por Cobrar por Venta de Bienes",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},
	{
		code: "165",
		name: "Fiscal - Cuentas por Cobrar Tributarias",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},
	{
		code: "166",
		name: "Crédito Fiscal IGV",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},
	{
		code: "168",
		name: "Otras Cuentas por Cobrar Diversas",
		level: "3",
		type: "Activo",
		parentCode: "16",
	},

	{
		code: "17",
		name: "Cuentas por Cobrar Diversas - Relacionadas",
		level: "2",
		type: "Activo",
	},
	{
		code: "171",
		name: "Préstamos a Entidades Relacionadas",
		level: "3",
		type: "Activo",
		parentCode: "17",
	},
	{
		code: "172",
		name: "Otras Cuentas por Cobrar a Relacionadas",
		level: "3",
		type: "Activo",
		parentCode: "17",
	},

	{
		code: "18",
		name: "Servicios y Otros Contratados por Anticipado",
		level: "2",
		type: "Activo",
	},
	{
		code: "181",
		name: "Seguros Pagados por Anticipado",
		level: "3",
		type: "Activo",
		parentCode: "18",
	},
	{
		code: "182",
		name: "Alquileres Pagados por Anticipado",
		level: "3",
		type: "Activo",
		parentCode: "18",
	},
	{
		code: "183",
		name: "Suscripciones Pagadas por Anticipado",
		level: "3",
		type: "Activo",
		parentCode: "18",
	},

	{
		code: "19",
		name: "Estimación de Cuentas de Cobranza Dudosa",
		level: "2",
		type: "Activo",
	},
	{
		code: "191",
		name: "Estimación de Cobranza Dudosa - Comerciales",
		level: "3",
		type: "Activo",
		parentCode: "19",
	},
	{
		code: "192",
		name: "Estimación de Cobranza Dudosa - Diversas",
		level: "3",
		type: "Activo",
		parentCode: "19",
	},

	// ========== ELEMENTO 2: ACTIVO REALIZABLE ==========
	{ code: "20", name: "Mercaderías", level: "2", type: "Activo" },
	{
		code: "201",
		name: "Mercaderías Manufacturadas",
		level: "3",
		type: "Activo",
		parentCode: "20",
	},
	{
		code: "202",
		name: "Mercaderías en Tránsito",
		level: "3",
		type: "Activo",
		parentCode: "20",
	},

	{ code: "21", name: "Productos Terminados", level: "2", type: "Activo" },
	{
		code: "211",
		name: "Productos Terminados Manufacturados",
		level: "3",
		type: "Activo",
		parentCode: "21",
	},
	{
		code: "212",
		name: "Productos Terminados en Tránsito",
		level: "3",
		type: "Activo",
		parentCode: "21",
	},

	{
		code: "22",
		name: "Subproductos, Desechos y Desperdicios",
		level: "2",
		type: "Activo",
	},
	{
		code: "221",
		name: "Subproductos",
		level: "3",
		type: "Activo",
		parentCode: "22",
	},
	{
		code: "222",
		name: "Desechos y Desperdicios",
		level: "3",
		type: "Activo",
		parentCode: "22",
	},

	{ code: "23", name: "Productos en Proceso", level: "2", type: "Activo" },
	{
		code: "231",
		name: "Productos en Proceso Manufacturados",
		level: "3",
		type: "Activo",
		parentCode: "23",
	},
	{
		code: "232",
		name: "Órdenes de Producción",
		level: "3",
		type: "Activo",
		parentCode: "23",
	},

	{ code: "24", name: "Materias Primas", level: "2", type: "Activo" },
	{
		code: "241",
		name: "Materias Primas Nacionales",
		level: "3",
		type: "Activo",
		parentCode: "24",
	},
	{
		code: "242",
		name: "Materias Primas Importadas",
		level: "3",
		type: "Activo",
		parentCode: "24",
	},

	{
		code: "25",
		name: "Materiales Auxiliares, Suministros y Repuestos",
		level: "2",
		type: "Activo",
	},
	{
		code: "251",
		name: "Materiales Auxiliares",
		level: "3",
		type: "Activo",
		parentCode: "25",
	},
	{
		code: "252",
		name: "Suministros Diversos",
		level: "3",
		type: "Activo",
		parentCode: "25",
	},
	{
		code: "253",
		name: "Repuestos",
		level: "3",
		type: "Activo",
		parentCode: "25",
	},

	{ code: "26", name: "Envases y Embalajes", level: "2", type: "Activo" },
	{
		code: "261",
		name: "Envases",
		level: "3",
		type: "Activo",
		parentCode: "26",
	},
	{
		code: "262",
		name: "Embalajes",
		level: "3",
		type: "Activo",
		parentCode: "26",
	},

	{
		code: "27",
		name: "Activos No Corrientes Mantenidos para la Venta",
		level: "2",
		type: "Activo",
	},
	{
		code: "271",
		name: "Activos No Corrientes Mantenidos para la Venta",
		level: "3",
		type: "Activo",
		parentCode: "27",
	},

	{
		code: "28",
		name: "Desvalorización de Existencias",
		level: "2",
		type: "Activo",
	},
	{
		code: "281",
		name: "Desvalorización de Mercaderías",
		level: "3",
		type: "Activo",
		parentCode: "28",
	},
	{
		code: "282",
		name: "Desvalorización de Productos Terminados",
		level: "3",
		type: "Activo",
		parentCode: "28",
	},
	{
		code: "283",
		name: "Desvalorización de Materias Primas",
		level: "3",
		type: "Activo",
		parentCode: "28",
	},

	{
		code: "29",
		name: "Desvalorización de Activos No Corrientes Mantenidos para la Venta",
		level: "2",
		type: "Activo",
	},

	// ========== ELEMENTO 3: ACTIVO INMOVILIZADO ==========
	{ code: "30", name: "Inversiones Mobiliarias", level: "2", type: "Activo" },
	{
		code: "301",
		name: "Inversiones Mobiliarias - Costo",
		level: "3",
		type: "Activo",
		parentCode: "30",
	},
	{
		code: "302",
		name: "Inversiones Mobiliarias - Valor Razonable",
		level: "3",
		type: "Activo",
		parentCode: "30",
	},

	{ code: "31", name: "Inversiones Inmobiliarias", level: "2", type: "Activo" },
	{
		code: "311",
		name: "Terrenos",
		level: "3",
		type: "Activo",
		parentCode: "31",
	},
	{
		code: "312",
		name: "Edificios",
		level: "3",
		type: "Activo",
		parentCode: "31",
	},

	{
		code: "32",
		name: "Activos por Derecho de Uso",
		level: "2",
		type: "Activo",
	},

	{
		code: "33",
		name: "Inmuebles, Maquinaria y Equipo",
		level: "2",
		type: "Activo",
	},
	{
		code: "331",
		name: "Terrenos",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "332",
		name: "Edificios y Construcciones",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "333",
		name: "Maquinaria y Equipo de Explotación",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "334",
		name: "Equipo de Transporte",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "335",
		name: "Muebles y Enseres",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "336",
		name: "Equipos de Cómputo y Sistemas Informáticos",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "337",
		name: "Equipos Diversos",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},
	{
		code: "338",
		name: "Construcciones en Curso",
		level: "3",
		type: "Activo",
		parentCode: "33",
	},

	{ code: "34", name: "Intangibles", level: "2", type: "Activo" },
	{
		code: "341",
		name: "Software y Licencias",
		level: "3",
		type: "Activo",
		parentCode: "34",
	},
	{
		code: "342",
		name: "Patentes y Marcas",
		level: "3",
		type: "Activo",
		parentCode: "34",
	},
	{
		code: "343",
		name: "Plusvalía Mercantil (Goodwill)",
		level: "3",
		type: "Activo",
		parentCode: "34",
	},

	{ code: "35", name: "Activos Biológicos", level: "2", type: "Activo" },

	{ code: "36", name: "Depreciación Acumulada", level: "2", type: "Activo" },
	{
		code: "361",
		name: "Depreciación Acumulada - Edificios",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},
	{
		code: "362",
		name: "Depreciación Acumulada - Maquinaria",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},
	{
		code: "363",
		name: "Depreciación Acumulada - Transporte",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},
	{
		code: "364",
		name: "Depreciación Acumulada - Muebles",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},
	{
		code: "365",
		name: "Depreciación Acumulada - Equipos de Cómputo",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},
	{
		code: "366",
		name: "Depreciación Acumulada - Equipos Diversos",
		level: "3",
		type: "Activo",
		parentCode: "36",
	},

	{ code: "37", name: "Amortización Acumulada", level: "2", type: "Activo" },
	{
		code: "371",
		name: "Amortización Acumulada - Intangibles",
		level: "3",
		type: "Activo",
		parentCode: "37",
	},

	{
		code: "38",
		name: "Desvalorización de Activo Inmovilizado",
		level: "2",
		type: "Activo",
	},

	{
		code: "39",
		name: "Depreciación y Amortización Acumulada - Activos por Derecho de Uso",
		level: "2",
		type: "Activo",
	},

	// ========== ELEMENTO 4: PASIVO ==========
	{
		code: "40",
		name: "Tributos y Aportes por Pagar",
		level: "2",
		type: "Pasivo",
	},
	{
		code: "401",
		name: "IGV por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "402",
		name: "Impuesto a la Renta por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "403",
		name: "ESSALUD por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "404",
		name: "ONP por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "405",
		name: "AFP por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "406",
		name: "Renta de Quinta Categoría por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},
	{
		code: "409",
		name: "Otros Tributos por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "40",
	},

	{ code: "41", name: "Remuneraciones por Pagar", level: "2", type: "Pasivo" },
	{
		code: "411",
		name: "Sueldos por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "41",
	},
	{
		code: "412",
		name: "Gratificaciones por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "41",
	},
	{
		code: "413",
		name: "CTS por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "41",
	},
	{
		code: "414",
		name: "Vacaciones por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "41",
	},

	{
		code: "42",
		name: "Cuentas por Pagar Comerciales - Terceros",
		level: "2",
		type: "Pasivo",
	},
	{
		code: "421",
		name: "Facturas por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "42",
	},
	{
		code: "422",
		name: "Boletas por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "42",
	},

	{
		code: "43",
		name: "Cuentas por Pagar Comerciales - Relacionadas",
		level: "2",
		type: "Pasivo",
	},

	{
		code: "44",
		name: "Cuentas por Pagar a Accionistas y Personal",
		level: "2",
		type: "Pasivo",
	},

	{ code: "45", name: "Obligaciones Financieras", level: "2", type: "Pasivo" },
	{
		code: "451",
		name: "Préstamos Bancarios Corto Plazo",
		level: "3",
		type: "Pasivo",
		parentCode: "45",
	},
	{
		code: "452",
		name: "Préstamos Bancarios Largo Plazo",
		level: "3",
		type: "Pasivo",
		parentCode: "45",
	},
	{
		code: "453",
		name: "Tarjetas de Crédito por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "45",
	},

	{
		code: "46",
		name: "Cuentas por Pagar Diversas - Terceros",
		level: "2",
		type: "Pasivo",
	},
	{
		code: "461",
		name: "Dividendos por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "46",
	},
	{
		code: "462",
		name: "Honorarios por Pagar",
		level: "3",
		type: "Pasivo",
		parentCode: "46",
	},

	{
		code: "47",
		name: "Cuentas por Pagar Diversas - Relacionadas",
		level: "2",
		type: "Pasivo",
	},

	{ code: "48", name: "Provisiones", level: "2", type: "Pasivo" },
	{
		code: "481",
		name: "Provisión para Vacaciones",
		level: "3",
		type: "Pasivo",
		parentCode: "48",
	},
	{
		code: "482",
		name: "Provisión para Gratificaciones",
		level: "3",
		type: "Pasivo",
		parentCode: "48",
	},
	{
		code: "483",
		name: "Provisión para CTS",
		level: "3",
		type: "Pasivo",
		parentCode: "48",
	},
	{
		code: "489",
		name: "Otras Provisiones",
		level: "3",
		type: "Pasivo",
		parentCode: "48",
	},

	{ code: "49", name: "Pasivo Diferido", level: "2", type: "Pasivo" },
	{
		code: "491",
		name: "Impuesto a la Renta Diferido Pasivo",
		level: "3",
		type: "Pasivo",
		parentCode: "49",
	},

	// ========== ELEMENTO 5: PATRIMONIO NETO ==========
	{ code: "50", name: "Capital", level: "2", type: "Patrimonio" },
	{
		code: "501",
		name: "Capital Social",
		level: "3",
		type: "Patrimonio",
		parentCode: "50",
	},
	{
		code: "502",
		name: "Capital Adicional",
		level: "3",
		type: "Patrimonio",
		parentCode: "50",
	},

	{ code: "51", name: "Acciones de Inversión", level: "2", type: "Patrimonio" },

	{
		code: "52",
		name: "Capital Adicional Suplementario",
		level: "2",
		type: "Patrimonio",
	},

	{
		code: "53",
		name: "Resultados no Realizados",
		level: "2",
		type: "Patrimonio",
	},

	{ code: "54", name: "Reservas", level: "2", type: "Patrimonio" },
	{
		code: "541",
		name: "Reserva Legal",
		level: "3",
		type: "Patrimonio",
		parentCode: "54",
	},
	{
		code: "542",
		name: "Reserva Facultativa",
		level: "3",
		type: "Patrimonio",
		parentCode: "54",
	},

	{ code: "55", name: "Resultados Acumulados", level: "2", type: "Patrimonio" },
	{
		code: "551",
		name: "Utilidades Acumuladas",
		level: "3",
		type: "Patrimonio",
		parentCode: "55",
	},
	{
		code: "552",
		name: "Pérdidas Acumuladas",
		level: "3",
		type: "Patrimonio",
		parentCode: "55",
	},

	{
		code: "57",
		name: "Excedente de Revaluación",
		level: "2",
		type: "Patrimonio",
	},

	{
		code: "58",
		name: "Resultado del Ejercicio",
		level: "2",
		type: "Patrimonio",
	},
	{
		code: "581",
		name: "Utilidad del Ejercicio",
		level: "3",
		type: "Patrimonio",
		parentCode: "58",
	},
	{
		code: "582",
		name: "Pérdida del Ejercicio",
		level: "3",
		type: "Patrimonio",
		parentCode: "58",
	},

	{
		code: "59",
		name: "Resultado Neto del Ejercicio",
		level: "2",
		type: "Patrimonio",
	},

	// ========== ELEMENTO 6: GASTOS POR NATURALEZA ==========
	{ code: "60", name: "Compras", level: "2", type: "Gasto" },
	{
		code: "601",
		name: "Compras de Mercaderías",
		level: "3",
		type: "Gasto",
		parentCode: "60",
	},
	{
		code: "602",
		name: "Compras de Materias Primas",
		level: "3",
		type: "Gasto",
		parentCode: "60",
	},
	{
		code: "603",
		name: "Compras de Materiales Auxiliares",
		level: "3",
		type: "Gasto",
		parentCode: "60",
	},
	{
		code: "604",
		name: "Compras de Envases y Embalajes",
		level: "3",
		type: "Gasto",
		parentCode: "60",
	},

	{ code: "61", name: "Variación de Existencias", level: "2", type: "Gasto" },

	{ code: "62", name: "Gastos de Personal", level: "2", type: "Gasto" },
	{
		code: "621",
		name: "Sueldos y Salarios",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},
	{
		code: "622",
		name: "Gratificaciones",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},
	{ code: "623", name: "CTS", level: "3", type: "Gasto", parentCode: "62" },
	{
		code: "624",
		name: "Vacaciones",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},
	{ code: "625", name: "ESSALUD", level: "3", type: "Gasto", parentCode: "62" },
	{
		code: "626",
		name: "ONP - Aportes",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},
	{
		code: "627",
		name: "AFP - Aportes",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},
	{
		code: "628",
		name: "Capacitación del Personal",
		level: "3",
		type: "Gasto",
		parentCode: "62",
	},

	{
		code: "63",
		name: "Gastos de Servicios Prestados por Terceros",
		level: "2",
		type: "Gasto",
	},
	{
		code: "631",
		name: "Servicios Públicos (Luz, Agua, Teléfono)",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{
		code: "632",
		name: "Alquileres",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{
		code: "633",
		name: "Honorarios Profesionales",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{
		code: "634",
		name: "Mantenimiento y Reparaciones",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{ code: "635", name: "Seguros", level: "3", type: "Gasto", parentCode: "63" },
	{
		code: "636",
		name: "Publicidad y Propaganda",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{
		code: "637",
		name: "Servicios de Transporte",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},
	{
		code: "638",
		name: "Comisiones Bancarias",
		level: "3",
		type: "Gasto",
		parentCode: "63",
	},

	{ code: "64", name: "Gastos por Tributos", level: "2", type: "Gasto" },
	{
		code: "641",
		name: "IGV No Acreditable",
		level: "3",
		type: "Gasto",
		parentCode: "64",
	},
	{
		code: "642",
		name: "Impuesto a la Renta Corriente",
		level: "3",
		type: "Gasto",
		parentCode: "64",
	},
	{
		code: "643",
		name: "Impuesto Predial",
		level: "3",
		type: "Gasto",
		parentCode: "64",
	},
	{
		code: "644",
		name: "Impuesto al Patrimonio Vehicular",
		level: "3",
		type: "Gasto",
		parentCode: "64",
	},
	{
		code: "645",
		name: "ITF - Impuesto a las Transacciones Financieras",
		level: "3",
		type: "Gasto",
		parentCode: "64",
	},

	{ code: "65", name: "Cargas Financieras", level: "2", type: "Gasto" },
	{
		code: "651",
		name: "Intereses Bancarios",
		level: "3",
		type: "Gasto",
		parentCode: "65",
	},
	{
		code: "652",
		name: "Intereses por Prestamos",
		level: "3",
		type: "Gasto",
		parentCode: "65",
	},
	{
		code: "653",
		name: "Diferencias de Cambio - Pérdida",
		level: "3",
		type: "Gasto",
		parentCode: "65",
	},
	{
		code: "654",
		name: "Descuentos por Pronto Pago Otorgados",
		level: "3",
		type: "Gasto",
		parentCode: "65",
	},

	{
		code: "66",
		name: "Gastos por Depreciación y Amortización",
		level: "2",
		type: "Gasto",
	},
	{
		code: "661",
		name: "Depreciación de Inmuebles, Maquinaria y Equipo",
		level: "3",
		type: "Gasto",
		parentCode: "66",
	},
	{
		code: "662",
		name: "Amortización de Intangibles",
		level: "3",
		type: "Gasto",
		parentCode: "66",
	},

	{ code: "67", name: "Provisiones del Ejercicio", level: "2", type: "Gasto" },
	{
		code: "671",
		name: "Provisión para Cuentas de Cobranza Dudosa",
		level: "3",
		type: "Gasto",
		parentCode: "67",
	},
	{
		code: "672",
		name: "Provisión por Desvalorización de Existencias",
		level: "3",
		type: "Gasto",
		parentCode: "67",
	},

	{ code: "68", name: "Gastos Diversos", level: "2", type: "Gasto" },
	{
		code: "681",
		name: "Multas y Sanciones",
		level: "3",
		type: "Gasto",
		parentCode: "68",
	},
	{
		code: "682",
		name: "Donaciones",
		level: "3",
		type: "Gasto",
		parentCode: "68",
	},
	{
		code: "683",
		name: "Suscripciones y Cotizaciones",
		level: "3",
		type: "Gasto",
		parentCode: "68",
	},

	// ========== ELEMENTO 7: INGRESOS ==========
	{ code: "70", name: "Ventas", level: "2", type: "Ingreso" },
	{
		code: "701",
		name: "Venta de Mercaderías",
		level: "3",
		type: "Ingreso",
		parentCode: "70",
	},
	{
		code: "702",
		name: "Venta de Productos Terminados",
		level: "3",
		type: "Ingreso",
		parentCode: "70",
	},
	{
		code: "703",
		name: "Venta de Subproductos",
		level: "3",
		type: "Ingreso",
		parentCode: "70",
	},
	{
		code: "704",
		name: "Venta de Materiales de Desecho",
		level: "3",
		type: "Ingreso",
		parentCode: "70",
	},
	{
		code: "705",
		name: "Prestación de Servicios",
		level: "3",
		type: "Ingreso",
		parentCode: "70",
	},

	{
		code: "71",
		name: "Variación de la Producción Almacenada",
		level: "2",
		type: "Ingreso",
	},

	{
		code: "72",
		name: "Producción de Activo Inmovilizado",
		level: "2",
		type: "Ingreso",
	},

	{
		code: "73",
		name: "Descuentos Obtenidos por Pronto Pago",
		level: "2",
		type: "Ingreso",
	},

	{ code: "74", name: "Ingresos Diversos", level: "2", type: "Ingreso" },
	{
		code: "741",
		name: "Ingresos por Alquileres",
		level: "3",
		type: "Ingreso",
		parentCode: "74",
	},
	{
		code: "742",
		name: "Comisiones Recibidas",
		level: "3",
		type: "Ingreso",
		parentCode: "74",
	},
	{
		code: "743",
		name: "Ingresos por Enajenación de Activos",
		level: "3",
		type: "Ingreso",
		parentCode: "74",
	},

	{ code: "75", name: "Ingresos Financieros", level: "2", type: "Ingreso" },
	{
		code: "751",
		name: "Intereses Ganados",
		level: "3",
		type: "Ingreso",
		parentCode: "75",
	},
	{
		code: "752",
		name: "Diferencias de Cambio - Ganancia",
		level: "3",
		type: "Ingreso",
		parentCode: "75",
	},
	{
		code: "753",
		name: "Descuentos por Pronto Pago Recibidos",
		level: "3",
		type: "Ingreso",
		parentCode: "75",
	},

	{
		code: "76",
		name: "Ganancias por Medición de Activos",
		level: "2",
		type: "Ingreso",
	},

	{
		code: "77",
		name: "Ingresos por Subsidios y Donaciones",
		level: "2",
		type: "Ingreso",
	},

	{
		code: "78",
		name: "Cargas Cubiertas por Provisiones",
		level: "2",
		type: "Ingreso",
	},

	{
		code: "79",
		name: "Cargas Imputables a Cuentas de Costos",
		level: "2",
		type: "Ingreso",
	},

	// ========== ELEMENTO 8: SALDOS INTERMEDIARIOS DE GESTIÓN ==========
	{ code: "80", name: "Margen Comercial", level: "2", type: "Saldo" },

	{ code: "81", name: "Producción del Ejercicio", level: "2", type: "Saldo" },

	{ code: "82", name: "Valor Agregado", level: "2", type: "Saldo" },

	{
		code: "83",
		name: "Excedente Bruto de Explotación",
		level: "2",
		type: "Saldo",
	},

	{ code: "84", name: "Resultado de Explotación", level: "2", type: "Saldo" },

	{ code: "85", name: "Resultado Financiero", level: "2", type: "Saldo" },

	{
		code: "86",
		name: "Resultado antes de Participaciones e Impuestos",
		level: "2",
		type: "Saldo",
	},

	{
		code: "87",
		name: "Participaciones de los Trabajadores",
		level: "2",
		type: "Saldo",
	},

	{ code: "88", name: "Impuesto a la Renta", level: "2", type: "Saldo" },

	{ code: "89", name: "Resultado del Ejercicio", level: "2", type: "Saldo" },

	// ========== ELEMENTO 9: COSTOS DE PRODUCCIÓN ==========
	{ code: "90", name: "Costos de Producción", level: "2", type: "Costo" },
	{
		code: "901",
		name: "Materia Prima Directa",
		level: "3",
		type: "Costo",
		parentCode: "90",
	},
	{
		code: "902",
		name: "Mano de Obra Directa",
		level: "3",
		type: "Costo",
		parentCode: "90",
	},
	{
		code: "903",
		name: "Costos Indirectos de Fabricación",
		level: "3",
		type: "Costo",
		parentCode: "90",
	},

	{
		code: "91",
		name: "Costo de Producción Realizado",
		level: "2",
		type: "Costo",
	},

	{ code: "92", name: "Costos de Servicios", level: "2", type: "Costo" },

	{ code: "93", name: "Costo de Adquisición", level: "2", type: "Costo" },
	{
		code: "931",
		name: "Costo de Adquisición de Mercaderías",
		level: "3",
		type: "Costo",
		parentCode: "93",
	},
	{
		code: "932",
		name: "Costo de Adquisición de Materias Primas",
		level: "3",
		type: "Costo",
		parentCode: "93",
	},

	{ code: "94", name: "Costos de Transformación", level: "2", type: "Costo" },

	{
		code: "95",
		name: "Costo de los Servicios Prestados",
		level: "2",
		type: "Costo",
	},

	{
		code: "96",
		name: "Costo de Producción del Ejercicio",
		level: "2",
		type: "Costo",
	},

	{
		code: "97",
		name: "Costo de Producción por Proceso",
		level: "2",
		type: "Costo",
	},

	{
		code: "98",
		name: "Costo de Producción por Órdenes",
		level: "2",
		type: "Costo",
	},
];

/**
 * Seed the PCGE catalog idempotently.
 * Uses onConflictDoNothing so it's safe to run multiple times.
 */
export async function seedPcgeCatalog(
	db: {
		insert: (table: unknown) => {
			values: (data: unknown[]) => {
				onConflictDoNothing: () => Promise<unknown>;
			};
		};
	},
	companyId: string,
): Promise<void> {
	const accounts = PCGE_CATALOG.map((entry) => ({
		companyId,
		code: entry.code,
		name: entry.name,
		level: entry.level,
		type: entry.type,
		isActive: "S" as const,
	}));

	await db.insert(pcgeAccounts).values(accounts).onConflictDoNothing();
}

/**
 * Returns the full PCGE catalog entries for reference.
 */
export function getPcgeCatalog(): readonly PcgeAccountInput[] {
	return PCGE_CATALOG;
}
