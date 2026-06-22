import { DeterministicValidatorOrchestratorService } from "@arkelythex/application/fiscal-truth";
import {
	DocumentSeriesValidator,
	MoneyIgvConsistencyValidator,
	RetentionDetractionValidator,
	RucDeterministicValidator,
	SireReproducibilityValidator,
	Ubl21Validator,
} from "./index";

/**
 * Creates a deterministic validator orchestrator with versioned infrastructure adapters.
 */
export function createFiscalTruthDeterministicOrchestrator(): DeterministicValidatorOrchestratorService {
	return new DeterministicValidatorOrchestratorService([
		new RucDeterministicValidator(),
		new MoneyIgvConsistencyValidator(),
		new DocumentSeriesValidator(),
		new Ubl21Validator(),
		new SireReproducibilityValidator(),
		new RetentionDetractionValidator(),
	]);
}
