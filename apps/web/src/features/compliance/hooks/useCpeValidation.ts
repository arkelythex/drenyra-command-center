import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	type CpeValidationEnvelope,
	getCpeValidatorClient,
	isCpeValidationEnvelope,
} from "../api/compliance-client";
import { buildCpeValidationRequest } from "../components/tabs/cpe-validator/cpe-validation-request";
import type { MockCpeRow } from "../components/tabs/cpe-validator/cpe-validator.mock";

type ValidationRunbook = CpeValidationEnvelope["runbook"];

export interface CpeValidationOutcome {
	success: boolean;
	statusCode: number;
	error?: string;
	code?: string;
	supportMessage?: string;
	runbook?: ValidationRunbook;
	data: CpeValidationEnvelope["data"];
}

const cpeValidatorClient = getCpeValidatorClient();

export function useCpeValidation(): UseMutationResult<
	CpeValidationOutcome,
	Error,
	MockCpeRow
> {
	return useMutation({
		mutationFn: async (row: MockCpeRow): Promise<CpeValidationOutcome> => {
			const requestBody = buildCpeValidationRequest(row);
			const response = await cpeValidatorClient.validate.post(requestBody);

			if (response.error) {
				const failure = response.error;

				if (
					typeof failure === "object" &&
					failure !== null &&
					"value" in failure &&
					isCpeValidationEnvelope(failure.value)
				) {
					return {
						success: false,
						statusCode:
							typeof failure.status === "number" ? failure.status : 400,
						error: failure.value.error,
						code: failure.value.code,
						supportMessage:
							failure.value.supportMessage ??
							failure.value.data.incident.supportMessage,
						runbook: failure.value.runbook,
						data: failure.value.data,
					};
				}

				throw new Error("No se pudo validar el comprobante");
			}

			if (!isCpeValidationEnvelope(response.data)) {
				throw new Error("Respuesta invalida del validador CPE");
			}

			return {
				success: true,
				statusCode: 200,
				data: response.data.data,
			};
		},
	});
}
