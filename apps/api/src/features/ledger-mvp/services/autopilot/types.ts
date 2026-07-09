import type {
	ComplianceReproducibilityReport,
	IGVSummary,
	SIRESummary,
	SIRESunatLiveSummary,
} from "@drenyra/domain";
import type {
	Pdt621Input,
	Pdt621Result,
} from "../../../taxation/pdt-621.service";

export interface LedgerSireAutopilotPorts {
	verifySireReproducibility: (input: {
		companyId: string;
		year: number;
		month: number;
		totalTolerance?: number;
		igvTolerance?: number;
		recordTolerance?: number;
	}) => Promise<ComplianceReproducibilityReport>;
	getIgvSummary: (
		companyId: string,
		year: number,
		month: number,
	) => Promise<IGVSummary>;
	getSireSummary: (
		companyId: string,
		year: number,
		month: number,
	) => Promise<SIRESummary>;
	getSunatLiveSummary?: (input: {
		companyId: string;
		period: string;
		ruc: string;
	}) => Promise<SIRESunatLiveSummary>;
	pdtBuilder: (input: Pdt621Input) => Pdt621Result;
	traceIdFactory: () => string;
	nowFactory: () => Date;
}
