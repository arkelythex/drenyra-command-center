import type { BuzonNotification, RucStatus } from "./types";

export function parseNotificationsFromPage(): BuzonNotification[] {
	const rows = document.querySelectorAll(".notificacion-row, tr.notification");
	const results: BuzonNotification[] = [];

	rows.forEach((row, index) => {
		const asunto =
			row.querySelector(".asunto, td:nth-child(2)")?.textContent?.trim() || "";
		const fecha =
			row.querySelector(".fecha, td:nth-child(3)")?.textContent?.trim() || "";
		const tipo =
			row.querySelector(".tipo, td:nth-child(1)")?.textContent?.trim() || "";
		const urgente =
			row.classList.contains("urgente") || tipo.includes("URGENTE");
		const leido = row.classList.contains("leido");

		results.push({
			id: `notif_${Date.now()}_${index}`,
			tipo: tipo.toUpperCase().includes("COBRANZA")
				? "COBRANZA"
				: tipo.toUpperCase().includes("FISCAL")
					? "FISCALIZACION"
					: "NOTIFICACION",
			asunto,
			fechaRecepcion: fecha,
			esUrgente: urgente,
			leido,
		});
	});

	return results;
}

export function parseRucStatusFromPage(): Partial<RucStatus> {
	const getText = (selector: string): string =>
		document.querySelector(selector)?.textContent?.trim() || "";

	return {
		razonSocial: getText(".razon-social, #razonSocial"),
		estado: getText(".estado, #estado").toUpperCase() as RucStatus["estado"],
		condicion: getText(
			".condicion, #condicion",
		).toUpperCase() as RucStatus["condicion"],
		fechaInscripcion: getText(".fecha-inscripcion, #fechaInscripcion"),
		direccion: getText(".direccion, #direccion"),
		actividadEconomica: getText(".actividad, #actividadEconomica"),
	};
}
