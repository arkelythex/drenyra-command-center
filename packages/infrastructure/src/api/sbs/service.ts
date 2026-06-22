import type { ConversionResult, TipoCambio, TipoCambioHistorico } from "./types";

function getToday(): string {
	return (
		new Date().toISOString().split("T")[0] ??
		new Date().toISOString().substring(0, 10)
	);
}

export async function obtenerTipoCambioSbs(
	fecha: string,
	moneda: "USD" | "EUR" = "USD",
): Promise<TipoCambio> {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
		throw new Error("Fecha debe estar en formato YYYY-MM-DD");
	}

	try {
		const apiToken = process.env.APIS_PERU_TOKEN;

		if (apiToken && moneda === "USD") {
			const response = await fetch(
				`https://api.apis.net.pe/v2/sunat/tipo-cambio?fecha=${fecha}`,
				{
					headers: {
						Authorization: `Bearer ${apiToken}`,
						Accept: "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				return {
					fecha: data.fecha || fecha,
					moneda: "USD",
					compra: parseFloat(data.compra) || 0,
					venta: parseFloat(data.venta) || 0,
					fuente: "SBS - Superintendencia de Banca y Seguros",
				};
			}
		}

		const altResponse = await fetch(
			`https://api.exchangerate-api.com/v4/latest/${moneda === "USD" ? "USD" : "EUR"}`,
		);

		if (altResponse.ok) {
			const data = await altResponse.json();
			const rate = data.rates?.PEN || 0;

			return {
				fecha,
				moneda,
				compra: Math.round((rate - 0.03) * 100) / 100,
				venta: Math.round((rate + 0.03) * 100) / 100,
				fuente: "Exchange Rate API (aproximado)",
			};
		}

		console.warn("[SBS API] Using fallback exchange rate");
		return getFallbackRate(fecha, moneda);
	} catch (error) {
		console.error("[SBS API] Error:", error);
		return getFallbackRate(fecha, moneda);
	}
}

export async function obtenerTipoCambioHoy(
	moneda: "USD" | "EUR" = "USD",
): Promise<TipoCambio> {
	const today = getToday();
	return obtenerTipoCambioSbs(today, moneda);
}

export async function obtenerTipoCambioRango(
	fechaInicio: string,
	fechaFin: string,
	moneda: "USD" | "EUR" = "USD",
): Promise<TipoCambioHistorico> {
	const rateInicio = await obtenerTipoCambioSbs(fechaInicio, moneda);
	const rateFin = await obtenerTipoCambioSbs(fechaFin, moneda);

	return {
		fechaInicio,
		fechaFin,
		moneda,
		datos: [
			{
				fecha: fechaInicio,
				compra: rateInicio.compra,
				venta: rateInicio.venta,
			},
			{ fecha: fechaFin, compra: rateFin.compra, venta: rateFin.venta },
		],
	};
}

export async function convertirMoneda(
	monto: number,
	de: "PEN" | "USD" | "EUR",
	a: "PEN" | "USD" | "EUR",
	fecha?: string,
): Promise<ConversionResult> {
	const fechaConsulta = fecha ?? getToday();

	if (de === a) {
		return {
			montoOriginal: monto,
			montoConvertido: monto,
			tipoCambio: 1,
			fecha: fechaConsulta,
		};
	}

	let tipoCambio: TipoCambio;

	if (de === "PEN" && a === "USD") {
		tipoCambio = await obtenerTipoCambioSbs(fechaConsulta, "USD");
		const convertido = monto / tipoCambio.venta;
		return {
			montoOriginal: monto,
			montoConvertido: Math.round(convertido * 100) / 100,
			tipoCambio: tipoCambio.venta,
			fecha: fechaConsulta,
		};
	}

	if (de === "USD" && a === "PEN") {
		tipoCambio = await obtenerTipoCambioSbs(fechaConsulta, "USD");
		const convertido = monto * tipoCambio.compra;
		return {
			montoOriginal: monto,
			montoConvertido: Math.round(convertido * 100) / 100,
			tipoCambio: tipoCambio.compra,
			fecha: fechaConsulta,
		};
	}

	if (de === "PEN" && a === "EUR") {
		tipoCambio = await obtenerTipoCambioSbs(fechaConsulta, "EUR");
		const convertido = monto / tipoCambio.venta;
		return {
			montoOriginal: monto,
			montoConvertido: Math.round(convertido * 100) / 100,
			tipoCambio: tipoCambio.venta,
			fecha: fechaConsulta,
		};
	}

	if (de === "EUR" && a === "PEN") {
		tipoCambio = await obtenerTipoCambioSbs(fechaConsulta, "EUR");
		const convertido = monto * tipoCambio.compra;
		return {
			montoOriginal: monto,
			montoConvertido: Math.round(convertido * 100) / 100,
			tipoCambio: tipoCambio.compra,
			fecha: fechaConsulta,
		};
	}

	if (de === "USD" && a === "EUR") {
		const usdRate = await obtenerTipoCambioSbs(fechaConsulta, "USD");
		const eurRate = await obtenerTipoCambioSbs(fechaConsulta, "EUR");
		const penAmount = monto * usdRate.compra;
		const convertido = penAmount / eurRate.venta;
		return {
			montoOriginal: monto,
			montoConvertido: Math.round(convertido * 100) / 100,
			tipoCambio: usdRate.compra / eurRate.venta,
			fecha: fechaConsulta,
		};
	}

	const usdRate = await obtenerTipoCambioSbs(fechaConsulta, "USD");
	const eurRate = await obtenerTipoCambioSbs(fechaConsulta, "EUR");
	const penAmount = monto * eurRate.compra;
	const convertido = penAmount / usdRate.venta;
	return {
		montoOriginal: monto,
		montoConvertido: Math.round(convertido * 100) / 100,
		tipoCambio: eurRate.compra / usdRate.venta,
		fecha: fechaConsulta,
	};
}

function getFallbackRate(fecha: string, moneda: "USD" | "EUR"): TipoCambio {
	const rates: Record<"USD" | "EUR", { compra: number; venta: number }> = {
		USD: { compra: 3.72, venta: 3.75 },
		EUR: { compra: 4.02, venta: 4.08 },
	};

	return {
		fecha,
		moneda,
		compra: rates[moneda].compra,
		venta: rates[moneda].venta,
		fuente: "Tasa de referencia (sin conexión a SBS)",
	};
}
