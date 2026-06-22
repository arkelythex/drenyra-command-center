/**
 * SunatDashboard — mock/seed data for initial development.
 */

import type { Notification, RucInfo, SirePeriod, TaxDeadline } from "./SunatDashboard.types";

export const MOCK_RUC: RucInfo = {
	ruc: "20612345678",
	razonSocial: "ARKELYTHEX S.A.C.",
	estado: "ACTIVO",
	ultimaVerificacion: new Date(2026, 5, 1),
};

export const MOCK_SIRE_PERIODS: SirePeriod[] = [
	{ periodo: "2026-01", estado: "VALIDADO", vencimiento: new Date(2026, 1, 15) },
	{ periodo: "2026-02", estado: "PENDIENTE", vencimiento: new Date(2026, 2, 15) },
	{ periodo: "2026-03", estado: "OBSERVADO", vencimiento: new Date(2026, 3, 15) },
	{ periodo: "2026-04", estado: "VALIDADO", vencimiento: new Date(2026, 4, 15) },
	{ periodo: "2026-05", estado: "VALIDADO", vencimiento: new Date(2026, 5, 15) },
	{ periodo: "2026-06", estado: "PENDIENTE", vencimiento: new Date(2026, 6, 15) },
];

export const MOCK_TAX_CALENDAR: TaxDeadline[] = [
	{
		obligacion: "PLAME",
		descripcion: "Planilla Mensual de Remuneraciones",
		fechaVencimiento: new Date(2026, 5, 15),
		tipo: "PLAME",
	},
	{
		obligacion: "IGV - Renta",
		descripcion: "Declaración y pago mensual IGV",
		fechaVencimiento: new Date(2026, 5, 20),
		tipo: "IGV",
	},
	{
		obligacion: "Detracciones SPOT",
		descripcion: "Depósito de detracciones",
		fechaVencimiento: new Date(2026, 5, 25),
		tipo: "DETRACCIONES",
	},
	{
		obligacion: "DJ Anual Renta",
		descripcion: "Declaración jurada anual",
		fechaVencimiento: new Date(2026, 5, 28),
		tipo: "RENTA",
	},
	{
		obligacion: "SIRE DJ Mensual",
		descripcion: "Declaración mensual SIRE",
		fechaVencimiento: new Date(2026, 5, 30),
		tipo: "SIRE",
	},
];

export const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		titulo: "Resolución SUNAT N° 087-2026/SUNAT",
		fecha: new Date(2026, 5, 10),
		tipo: "RESOLUCION",
		leida: false,
	},
	{
		id: "2",
		titulo: "Cambio de tasa IGV a 18%",
		fecha: new Date(2026, 5, 5),
		tipo: "CAMBIO",
		leida: false,
	},
	{
		id: "3",
		titulo: "Recordatorio: DJ SIRE Julio 2026",
		fecha: new Date(2026, 5, 1),
		tipo: "RECORDATORIO",
		leida: true,
	},
];
