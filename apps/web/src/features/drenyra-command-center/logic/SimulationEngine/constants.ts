/**
 * SimulationEngine — Patrones de detección y constantes fiscales.
 *
 * @since Jun 2026
 */

import type { SimulationCategory } from "./types";

export const PREDICTIVE_PATTERNS = [
	/(qué pasa si|qué pasaría si|qué impacto|simula|cómo afecta|como afecta|cómo cambiaría|como cambiaria)/i,
	/(aumento|reducción|incremento|disminución|cambio|variación|subir|bajar|modificar)/i,
];

export const CATEGORY_KEYWORDS: Record<SimulationCategory, RegExp[]> = {
	salary: [/salarios?/, /sueldos?/, /planilla/, /remuneracion/, /remuneración/, /personal/],
	revenue: [/ventas?/, /ingresos?/, /facturación/, /facturacion/, /ingreso/],
	expense: [/gastos?/, /costos?/, /proveedores?/, /suministros?/, /operativos?/],
	tax: [/impuestos?/, /igv/, /renta/, /tributos?/, /sunat/, /sire/],
	investment: [/inversión/, /inversion/, /invertir/, /capital/, /activos?/],
};

export const TAX_RATE = 0.18; // 18% IGV
export const RENTA_RATE = 0.295; // 29.5% Renta
