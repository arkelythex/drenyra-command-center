/**
 * CivicApplicationService — Facade that orchestrates all civic commands/queries
 *
 * Single entry point for the API layer. Follows the banking feature pattern
 * where an ApplicationService orchestrates handlers at the API boundary.
 */
import type {
	AuditTrailRepository,
	CivicCaseRepository,
	ElectionRepository,
	ElectoralActRepository,
	EventEmitter,
	FraudIndicatorRepository,
} from "@arkelythex/domain-civic";
import type { AddFraudEvidenceInput } from "../command/AddFraudEvidence";
import { AddFraudEvidence } from "../command/AddFraudEvidence";
import type { CreateCivicCaseInput } from "../command/CreateCivicCase";
import { CreateCivicCase } from "../command/CreateCivicCase";
import type { DetectFraudPatternInput } from "../command/DetectFraudPattern";
import { DetectFraudPattern } from "../command/DetectFraudPattern";
import type { EscalateCivicCaseInput } from "../command/EscalateCivicCase";
import { EscalateCivicCase } from "../command/EscalateCivicCase";
import type { ValidateElectoralActInput } from "../command/ValidateElectoralAct";
import { ValidateElectoralAct } from "../command/ValidateElectoralAct";
import type {
	AuditTrailEntryDTO,
	CivicCaseDTO,
	ElectionResultsDTO,
	FraudAnalysisReportDTO,
	ValidationResultDTO,
} from "../dto";
import type { GetAuditTrailInput } from "../query/GetAuditTrail";
import { GetAuditTrail } from "../query/GetAuditTrail";
import type { GetCivicCaseInput } from "../query/GetCivicCase";
import { GetCivicCase } from "../query/GetCivicCase";
import type { GetElectionResultsInput } from "../query/GetElectionResults";
import { GetElectionResults } from "../query/GetElectionResults";
import type { GetFraudAnalysisInput } from "../query/GetFraudAnalysis";
import { GetFraudAnalysis } from "../query/GetFraudAnalysis";

export class CivicApplicationService {
	private readonly validateAct: ValidateElectoralAct;
	private readonly detectFraud: DetectFraudPattern;
	private readonly createCivicCase: CreateCivicCase;
	private readonly escalateCivicCase: EscalateCivicCase;
	private readonly addFraudEvidence: AddFraudEvidence;
	private readonly getResults: GetElectionResults;
	private readonly getFraudAnalysis: GetFraudAnalysis;
	private readonly getAuditTrail: GetAuditTrail;
	private readonly getCivicCase: GetCivicCase;

	constructor(
		electionRepo: ElectionRepository,
		actRepo: ElectoralActRepository,
		auditRepo: AuditTrailRepository,
		indicatorRepo: FraudIndicatorRepository,
		civicCaseRepo: CivicCaseRepository,
		eventEmitter: EventEmitter,
	) {
		this.validateAct = new ValidateElectoralAct(
			actRepo,
			auditRepo,
			eventEmitter,
		);
		this.detectFraud = new DetectFraudPattern(
			electionRepo,
			actRepo,
			indicatorRepo,
			eventEmitter,
		);
		this.createCivicCase = new CreateCivicCase(civicCaseRepo);
		this.escalateCivicCase = new EscalateCivicCase(civicCaseRepo, eventEmitter);
		this.addFraudEvidence = new AddFraudEvidence(civicCaseRepo, eventEmitter);
		this.getResults = new GetElectionResults(electionRepo, actRepo);
		this.getFraudAnalysis = new GetFraudAnalysis(indicatorRepo);
		this.getAuditTrail = new GetAuditTrail(auditRepo);
		this.getCivicCase = new GetCivicCase(civicCaseRepo);
	}

	async validateElectoralAct(
		input: ValidateElectoralActInput,
	): Promise<ValidationResultDTO> {
		return this.validateAct.execute(input);
	}

	async detectFraudPattern(
		input: DetectFraudPatternInput,
	): Promise<FraudAnalysisReportDTO> {
		return this.detectFraud.execute(input);
	}

	async getElectionResults(
		input: GetElectionResultsInput,
	): Promise<ElectionResultsDTO> {
		return this.getResults.execute(input);
	}

	async getFraudAnalysisReport(
		input: GetFraudAnalysisInput,
	): Promise<FraudAnalysisReportDTO> {
		return this.getFraudAnalysis.execute(input);
	}

	async getAuditTrailEntries(
		input: GetAuditTrailInput,
	): Promise<AuditTrailEntryDTO[]> {
		return this.getAuditTrail.execute(input);
	}

	async createCivicCaseInstance(
		input: CreateCivicCaseInput,
	): Promise<CivicCaseDTO> {
		return this.createCivicCase.execute(input);
	}

	async escalateCivicCaseInstance(
		input: EscalateCivicCaseInput,
	): Promise<CivicCaseDTO> {
		return this.escalateCivicCase.execute(input);
	}

	async addFraudEvidenceToCase(
		input: AddFraudEvidenceInput,
	): Promise<CivicCaseDTO> {
		return this.addFraudEvidence.execute(input);
	}

	async getCivicCaseById(input: GetCivicCaseInput): Promise<CivicCaseDTO> {
		return this.getCivicCase.execute(input);
	}
}
