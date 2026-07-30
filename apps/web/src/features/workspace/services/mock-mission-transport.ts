import type { MissionSnapshot, MissionProposal, EvidenceItem } from "@drenyra/mission-domain";
import { AccountingMissionStatus } from "@drenyra/mission-domain";

let mockCounter = 0;

export async function* mockExecuteRunIntent(
  missionId: string,
  instruction: string,
): AsyncGenerator<MissionSnapshot> {
  const mid = `mock-${missionId}-${++mockCounter}`;
  const now = new Date().toISOString();

  const makeSnapshot = (
    status: AccountingMissionStatus,
    overrides: Partial<MissionSnapshot> = {},
  ): MissionSnapshot => ({
    id: mid,
    companyId: "mock-company",
    fiscalPeriod: "2026-01",
    intent: "monthly-close",
    status,
    version: 1,
    progress: 0,
    steps: [],
    currentStep: "",
    blockers: [],
    proposal: null,
    rejection: null,
    receiptId: null,
    receiptHash: null,
    lastEventSequence: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  yield makeSnapshot(AccountingMissionStatus.QUEUED, {
    lastEventSequence: 1,
  });

  yield makeSnapshot(AccountingMissionStatus.RUNNING, {
    progress: 3000,
    steps: [
      {
        id: "a1",
        name: `Analizando: ${instruction.slice(0, 80)}`,
        status: "IN_PROGRESS",
      },
    ],
    currentStep: "analyze",
    version: 2,
    lastEventSequence: 2,
  });

  const evidence: EvidenceItem[] = [
    { id: "e1", label: "Análisis automático", type: "report" },
  ];

  const proposal: MissionProposal = {
    id: `prop-${mid}`,
    missionId: mid,
    version: 1,
    evidence,
    evidenceHash: "mock-evidence-hash",
    summary: instruction,
    riskLevel: "MEDIUM",
    generatedAt: now,
  };

  yield makeSnapshot(AccountingMissionStatus.AWAITING_APPROVAL, {
    progress: 7000,
    steps: [
      { id: "a1", name: "Análisis completado", status: "COMPLETED" },
      { id: "p1", name: "Propuesta generada", status: "COMPLETED" },
    ],
    currentStep: "approval",
    proposal,
    version: 3,
    lastEventSequence: 3,
  });
}
