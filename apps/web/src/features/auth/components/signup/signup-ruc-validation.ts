import { useEffect, useState } from "react";
import { getCountryPack } from "@/lib/latam-country-packs";
import { simulateLatency } from "@/lib/simulated-latency";
import { validateRucLocal } from "./signup-form.validation";

export interface RucValidationState {
	status: "idle" | "loading" | "valid" | "invalid";
	companyName?: string;
	error?: string;
}

// Peru-only today — see signup-form.validation.ts. `taxIdLength` falls back
// to `11` only as a defensive default; Peru's pack always resolves it.
const PE_TAX_ID_LENGTH = getCountryPack("pe").taxIdLength ?? 11;

interface RucOnlineLookupResponse {
	success: boolean;
	data?: {
		valid: boolean;
		razonSocial?: string;
		message?: string;
	};
}

/**
 * Looks up a RUC's registered business name via the real SUNAT-backed
 * `/api/sunat/validate-ruc-online` endpoint (apps/api → apis.net.pe, with a
 * local-validation fallback server-side if that external API is unreachable
 * or `APIS_NET_PE_TOKEN` is unset).
 *
 * Returns `undefined` on any network/API failure or when the lookup has no
 * `razonSocial` (e.g. the server-side local-validation fallback) — callers
 * must supply their own generic fallback label rather than treating
 * `undefined` as an error.
 */
async function lookupCompanyName(ruc: string): Promise<string | undefined> {
	try {
		const response = await fetch("/api/sunat/validate-ruc-online", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ ruc }),
		});

		const payload = (await response
			.json()
			.catch(() => null)) as RucOnlineLookupResponse | null;

		const razonSocial = payload?.success
			? payload.data?.razonSocial
			: undefined;
		return typeof razonSocial === "string" && razonSocial.trim()
			? razonSocial
			: undefined;
	} catch {
		// Network failure (offline, API down, dev proxy misconfigured, ...) —
		// the caller falls back to a generic "valid" label.
		return undefined;
	}
}

export function useRucValidation(ruc: string): RucValidationState {
	const [rucValidation, setRucValidation] = useState<RucValidationState>({
		status: "idle",
	});

	useEffect(() => {
		if (ruc?.length !== PE_TAX_ID_LENGTH) {
			setRucValidation({ status: "idle" });
			return;
		}

		const timer = setTimeout(async () => {
			setRucValidation({ status: "loading" });
			await simulateLatency(800);

			const isValid = validateRucLocal(ruc);
			if (isValid) {
				const companyName = await lookupCompanyName(ruc);
				setRucValidation({
					status: "valid",
					companyName: companyName ?? "Empresa Válida",
				});
				return;
			}

			setRucValidation({
				status: "invalid",
				error: "RUC inválido (verificación módulo 11)",
			});
		}, 250);

		return () => clearTimeout(timer);
	}, [ruc]);

	return rucValidation;
}
