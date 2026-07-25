import { useEffect, useState } from "react";
import { simulateLatency } from "@/lib/simulated-latency";
import { validateRucLocal } from "./signup-form.validation";

export interface RucValidationState {
	status: "idle" | "loading" | "valid" | "invalid";
	companyName?: string;
	error?: string;
}

const MOCK_COMPANY_NAMES: Record<string, string> = {
	"20512345678": "EMPRESA DEMO SAC",
	"20100070970": "TELEFONICA DEL PERU SAA",
};

export function useRucValidation(ruc: string): RucValidationState {
	const [rucValidation, setRucValidation] = useState<RucValidationState>({
		status: "idle",
	});

	useEffect(() => {
		if (ruc?.length !== 11) {
			setRucValidation({ status: "idle" });
			return;
		}

		const timer = setTimeout(async () => {
			setRucValidation({ status: "loading" });
			await simulateLatency(800);

			const isValid = validateRucLocal(ruc);
			if (isValid) {
				setRucValidation({
					status: "valid",
					companyName: MOCK_COMPANY_NAMES[ruc] ?? "Empresa Válida",
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
