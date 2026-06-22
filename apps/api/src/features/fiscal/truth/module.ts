import {
	GetFiscalTruthEventQuery,
	type GovernanceBundlePort,
	GovernanceBundleService,
	ReplayFiscalTruthQuery,
	ReplayFiscalTruthService,
} from "@arkelythex/application";
import type {
	EvidenceGraphRepository,
	FiscalTruthRepository,
	ReplayRepository,
} from "@arkelythex/domain";
import {
	PostgresEvidenceGraphRepository,
	PostgresFiscalTruthRepository,
	PostgresReplayRepository,
} from "@arkelythex/infrastructure";
import { fiscalTruthRoutes } from "./routes";

export interface FiscalTruthModuleDependencies {
	evidenceRepository: EvidenceGraphRepository;
	fiscalTruthRepository: FiscalTruthRepository;
	replayRepository: ReplayRepository;
	governanceVerifier: GovernanceBundlePort;
}

/**
 * Fiscal-truth vertical slice module.
 */
export function createFiscalTruthModule(deps: FiscalTruthModuleDependencies) {
	const governance = new GovernanceBundleService(deps.governanceVerifier);
	const getEvent = new GetFiscalTruthEventQuery(deps.fiscalTruthRepository);
	const replayService = new ReplayFiscalTruthService({
		loadEventChain: deps.replayRepository.loadEventChain.bind(
			deps.replayRepository,
		),
		findNodeById: deps.evidenceRepository.findNodeById.bind(
			deps.evidenceRepository,
		),
		saveReplayResult: deps.replayRepository.saveReplayResult.bind(
			deps.replayRepository,
		),
	});
	const replayQuery = new ReplayFiscalTruthQuery(replayService);

	return fiscalTruthRoutes({
		governance,
		evidenceRepository: deps.evidenceRepository,
		fiscalTruthRepository: deps.fiscalTruthRepository,
		getEvent,
		replayQuery,
	});
}

const governanceVerifier: GovernanceBundlePort = {
	verify: async () => false,
};

export const fiscalTruthModule = createFiscalTruthModule({
	evidenceRepository: new PostgresEvidenceGraphRepository(),
	fiscalTruthRepository: new PostgresFiscalTruthRepository(),
	replayRepository: new PostgresReplayRepository(),
	governanceVerifier,
});
