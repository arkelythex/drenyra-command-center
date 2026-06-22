/**
 * Demo / placeholder data for the SUNAT compliance dashboard.
 */

import type { Period, SunatInvoice, TaxObligation } from "./SunatDashboard.types";

export const PERIODS: { value: Period; label: string }[] = [
	{ value: "2026-04", label: "Abril 2026" },
	{ value: "2026-03", label: "Marzo 2026" },
	{ value: "2026-02", label: "Febrero 2026" },
	{ value: "2026-01", label: "Enero 2026" },
];

export const DEMO_INVOICES: SunatInvoice[] = [
	{
		id: "1",
		serieNumero: "F001-00001234",
		tipo: "Factura",
		cliente: "Corporación Minera del Sur S.A.C.",
		monto: 15280.0,
		fechaEmision: "2026-04-10",
		estado: "ACCEPTED",
	},
	{
		id: "2",
		serieNumero: "B001-00005678",
		tipo: "Boleta",
		cliente: "Distribuidora San Martín E.I.R.L.",
		monto: 3450.5,
		fechaEmision: "2026-04-09",
		estado: "ACCEPTED",
	},
	{
		id: "3",
		serieNumero: "F001-00001235",
		tipo: "Factura",
		cliente: "Servicios Logísticos Norte S.A.",
		monto: 8920.75,
		fechaEmision: "2026-04-08",
		estado: "OBSERVED",
	},
	{
		id: "4",
		serieNumero: "F001-00001236",
		tipo: "Factura",
		cliente: "Tecnología Andina S.A.C.",
		monto: 23100.0,
		fechaEmision: "2026-04-07",
		estado: "ACCEPTED",
	},
	{
		id: "5",
		serieNumero: "B001-00005679",
		tipo: "Boleta",
		cliente: "Comercial del Centro E.I.R.L.",
		monto: 890.0,
		fechaEmision: "2026-04-06",
		estado: "REJECTED",
	},
	{
		id: "6",
		serieNumero: "F001-00001237",
		tipo: "Factura",
		cliente: "Inversiones Pesqueras Marítimas S.A.",
		monto: 18760.25,
		fechaEmision: "2026-04-05",
		estado: "ACCEPTED",
	},
	{
		id: "7",
		serieNumero: "F001-00001238",
		tipo: "Factura",
		cliente: "Constructora del Pacífico S.A.C.",
		monto: 44500.0,
		fechaEmision: "2026-04-04",
		estado: "ANNULLED",
	},
	{
		id: "8",
		serieNumero: "B001-00005680",
		tipo: "Boleta",
		cliente: "Ferretería Los Andes E.I.R.L.",
		monto: 1230.0,
		fechaEmision: "2026-04-03",
		estado: "ACCEPTED",
	},
	{
		id: "9",
		serieNumero: "F001-00001239",
		tipo: "Factura",
		cliente: "Agroindustria Verde S.A.C.",
		monto: 6780.0,
		fechaEmision: "2026-04-02",
		estado: "OBSERVED",
	},
	{
		id: "10",
		serieNumero: "F001-00001240",
		tipo: "Factura",
		cliente: "Transportes Unidos del Perú S.A.",
		monto: 3210.0,
		fechaEmision: "2026-04-01",
		estado: null,
	},
];

export const TAX_OBLIGATIONS: TaxObligation[] = [
	{
		id: "1",
		label: "PLAME — Planilla Electrónica",
		fechaVencimiento: "2026-05-10",
		status: "por-vencer",
	},
	{
		id: "2",
		label: "IGV — Declaración Mensual",
		fechaVencimiento: "2026-05-15",
		status: "por-vencer",
	},
	{
		id: "3",
		label: "Renta — Pagos a Cuenta",
		fechaVencimiento: "2026-05-18",
		status: "por-vencer",
	},
	{
		id: "4",
		label: "Detracciones — Depositar SPOT",
		fechaVencimiento: "2026-04-25",
		status: "vencido",
	},
];
