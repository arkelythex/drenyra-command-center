export async function consultarRucSunat(ruc) {
	if (!/^\d{11}$/.test(ruc)) {
		throw new Error("RUC debe tener 11 dígitos");
	}
	const isPersona = ruc.startsWith("10");
	const isEmpresa = ruc.startsWith("20");
	if (!isPersona && !isEmpresa) {
		throw new Error(
			"RUC inválido: debe iniciar con 10 (persona) o 20 (empresa)",
		);
	}
	try {
		const apiToken = process.env.APIS_PERU_TOKEN;
		if (apiToken) {
			const response = await fetch(
				`https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`,
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
					ruc: data.numeroDocumento || ruc,
					razonSocial: data.razonSocial || data.nombre || "No disponible",
					nombreComercial: data.nombreComercial,
					estado: data.estado || "DESCONOCIDO",
					condicion: data.condicion || "DESCONOCIDO",
					direccion: data.direccion,
					ubigeo: data.ubigeo,
					tipo: isEmpresa ? "PERSONA JURIDICA" : "PERSONA NATURAL",
					fechaInscripcion: data.fechaInscripcion,
					fechaInicioActividades: data.fechaInicioActividades,
					actividadEconomica: data.actividadEconomica,
				};
			}
		}
		console.warn("[SUNAT API] No token configured, using fallback validation");
		return {
			ruc,
			razonSocial: "Consulta pendiente (configure APIS_PERU_TOKEN)",
			estado: "PENDIENTE",
			condicion: "PENDIENTE",
			tipo: isEmpresa ? "PERSONA JURIDICA" : "PERSONA NATURAL",
		};
	} catch (error) {
		console.error("[SUNAT API] Error:", error);
		throw new Error(
			`Error consultando SUNAT: ${error instanceof Error ? error.message : "Error desconocido"}`,
		);
	}
}
export function validarDigitoVerificadorRuc(ruc) {
	if (!/^\d{11}$/.test(ruc)) return false;
	const digits = ruc.split("").map(Number);
	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let sum = 0;
	for (let i = 0; i < 10; i++) {
		const digit = digits[i] ?? 0;
		const weight = weights[i] ?? 1;
		sum += digit * weight;
	}
	const remainder = sum % 11;
	const checkDigit = 11 - remainder;
	const expectedDigit =
		checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;
	const lastDigit = digits[10] ?? -1;
	return lastDigit === expectedDigit;
}
export async function verificarComprobanteSunat(
	rucEmisor,
	tipo,
	serie,
	numero,
) {
	if (!/^\d{11}$/.test(rucEmisor)) {
		throw new Error("RUC emisor inválido");
	}
	const tipoDescripcion = {
		"01": "Factura",
		"03": "Boleta de Venta",
		"07": "Nota de Crédito",
		"08": "Nota de Débito",
	};
	const descripcion = tipoDescripcion[tipo] ?? "Comprobante";
	const seriePattern =
		tipo === "01" || tipo === "07" || tipo === "08" ? /^F\d{3}$/ : /^B\d{3}$/;
	if (!seriePattern.test(serie.toUpperCase())) {
		return {
			esValido: false,
			rucEmisor,
			tipoComprobante: descripcion,
			serie,
			numero,
			estado: "RECHAZADO",
			mensaje: `Serie inválida para ${descripcion}. Debe ser ${tipo === "01" ? "Fxxx" : "Bxxx"}`,
		};
	}
	if (!validarDigitoVerificadorRuc(rucEmisor)) {
		return {
			esValido: false,
			rucEmisor,
			tipoComprobante: descripcion,
			serie,
			numero,
			estado: "RECHAZADO",
			mensaje: "RUC emisor tiene dígito verificador inválido",
		};
	}
	return {
		esValido: true,
		rucEmisor,
		tipoComprobante: descripcion,
		serie: serie.toUpperCase(),
		numero,
		estado: "ACEPTADO",
		mensaje: `Formato válido. Para verificación completa, consulte el portal SUNAT.`,
	};
}
export function validarDni(dni) {
	return /^\d{8}$/.test(dni);
}
export async function consultarDni(dni) {
	if (!validarDni(dni)) {
		throw new Error("DNI debe tener 8 dígitos");
	}
	try {
		const apiToken = process.env.APIS_PERU_TOKEN;
		if (apiToken) {
			const response = await fetch(
				`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`,
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
					dni,
					nombres: data.nombres || "",
					apellidoPaterno: data.apellidoPaterno || "",
					apellidoMaterno: data.apellidoMaterno || "",
					nombreCompleto:
						`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
				};
			}
		}
		return {
			dni,
			nombres: "",
			apellidoPaterno: "",
			apellidoMaterno: "",
			nombreCompleto: "Consulta pendiente (configure APIS_PERU_TOKEN)",
		};
	} catch (error) {
		console.error("[DNI API] Error:", error);
		throw new Error(
			`Error consultando DNI: ${error instanceof Error ? error.message : "Error desconocido"}`,
		);
	}
}
//# sourceMappingURL=sunat.service.js.map
