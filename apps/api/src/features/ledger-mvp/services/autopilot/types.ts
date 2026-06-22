import type { ComplianceReproducibilityReport } from "../../../../types/compliance.types";
import type { IGVSummary } from "../../../../types/taxation.types";
import type { SIRESummary, SIRESunatLiveSummary } from "../../../../types/sire.types";
import type { Pdt621Input, Pdt621Result } from "../../../taxation/pdt-621.service";
import type {
	LedgerSireAutopilotInput,
	LedgerSireAutopilotResult,
} from "../../ledger-mvp.types";

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
