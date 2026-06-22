import type { DeterministicValidatorResultRecord } from "@arkelythex/domain";
import type { DeterministicFiscalValidatorPort } from "@arkelythex/application/fiscal-truth";
import type { FiscalDeterministicValidationInput } from "./types";

const VALIDATOR_NAME = "document-series";
const VALIDATOR_VERSION = "1.0.0";

const SERIES_PREFIX_BY_DOC_TYPE: Record<string, string> = {
	"01": "F",
	"03": "B",
	"07": "FC",
	"08": "FD",
	"09": "R",
};

export class DocumentSeriesValidator
	implements DeterministicFiscalValidatorPort
{
	async validate(input: unknown): Promise<DeterministicValidatorResultRecord> {
		const payload = (input ?? {}) as FiscalDeterministicValidationInput;
		const documentType = payload.documentType ?? "";
		const series = payload.series ?? "";
		const expectedPrefix = SERIES_PREFIX_BY_DOC_TYPE[documentType] ?? "";
		const isValid =
			expectedPrefix.length > 0 &&
			series.startsWith(expectedPrefix) &&
			series.length >= expectedPrefix.length + 2;

		return {
			validatorName: VALIDATOR_NAME,
			validatorVersion: VALIDATOR_VERSION,
			inputHash: `${VALIDATOR_NAME}:${documentType}:${series}`,
			isValid,
			code: isValid ? "SERIES_OK" : "SERIES_INVALID",
			reason: isValid
				? "Series prefix matches SUNAT document type rule."
				: "Series prefix does not match SUNAT document type rule.",
			severity: isValid ? "info" : "blocking",
			observedAt: new Date(0).toISOString(),
			payload: { documentType, series, expectedPrefix },
		};
	}
}
