import { ValidateElectoralAct } from "../command/ValidateElectoralAct";
import { DetectFraudPattern } from "../command/DetectFraudPattern";
import { CreateCivicCase } from "../command/CreateCivicCase";
import { EscalateCivicCase } from "../command/EscalateCivicCase";
import { AddFraudEvidence } from "../command/AddFraudEvidence";
import { GetElectionResults } from "../query/GetElectionResults";
import { GetFraudAnalysis } from "../query/GetFraudAnalysis";
import { GetAuditTrail } from "../query/GetAuditTrail";
import { GetCivicCase } from "../query/GetCivicCase";
export class CivicApplicationService {
    validateAct;
    detectFraud;
    createCivicCase;
    escalateCivicCase;
    addFraudEvidence;
    getResults;
    getFraudAnalysis;
    getAuditTrail;
    getCivicCase;
    constructor(electionRepo, actRepo, auditRepo, indicatorRepo, civicCaseRepo, eventEmitter) {
        this.validateAct = new ValidateElectoralAct(actRepo, auditRepo, eventEmitter);
        this.detectFraud = new DetectFraudPattern(electionRepo, actRepo, indicatorRepo, eventEmitter);
        this.createCivicCase = new CreateCivicCase(civicCaseRepo);
        this.escalateCivicCase = new EscalateCivicCase(civicCaseRepo, eventEmitter);
        this.addFraudEvidence = new AddFraudEvidence(civicCaseRepo, eventEmitter);
        this.getResults = new GetElectionResults(electionRepo, actRepo);
        this.getFraudAnalysis = new GetFraudAnalysis(indicatorRepo);
        this.getAuditTrail = new GetAuditTrail(auditRepo);
        this.getCivicCase = new GetCivicCase(civicCaseRepo);
    }
    async validateElectoralAct(input) {
        return this.validateAct.execute(input);
    }
    async detectFraudPattern(input) {
        return this.detectFraud.execute(input);
    }
    async getElectionResults(input) {
        return this.getResults.execute(input);
    }
    async getFraudAnalysisReport(input) {
        return this.getFraudAnalysis.execute(input);
    }
    async getAuditTrailEntries(input) {
        return this.getAuditTrail.execute(input);
    }
    async createCivicCaseInstance(input) {
        return this.createCivicCase.execute(input);
    }
    async escalateCivicCaseInstance(input) {
        return this.escalateCivicCase.execute(input);
    }
    async addFraudEvidenceToCase(input) {
        return this.addFraudEvidence.execute(input);
    }
    async getCivicCaseById(input) {
        return this.getCivicCase.execute(input);
    }
}
//# sourceMappingURL=CivicApplicationService.js.map