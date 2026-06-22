/**
 * CPE Validator API methods
 *
 * @module compliance/cpe-validator
 */

import { ApiError, unwrap } from "@/lib/api-helpers";
import {
	type CpeValidationEnvelope,
	getCpeValidatorClient,
	isCpeValidationEnvelope,
} from "../compliance-client";

const cpeValidatorClient = getCpeValidatorClient();

export const cpeValidatorApi = {
	/**
	 * POST /cpe-validator/validate
	 *
	 * Validates a CPE XML document against SUNAT rules.
	 *
	 * Transport errors use {@link unwrap}; logical validation outcomes stay in
	 * the envelope (`success` true/false) and are returned to callers.
	 */
	validateCpe: async (payload: {
		companyRuc: string;
		cpeNumber: string;
		xmlContent: string;
		issueDate: string;
		totalAmount: number;
		skipCache?: boolean;
	}): Promise<CpeValidationEnvelope> => {
		const body = await unwrap(cpeValidatorClient.validate.post(payload));
		if (!isCpeValidationEnvelope(body)) {
			throw new ApiError("Respuesta invalida del validador CPE");
		}
		return body;
	},
};
