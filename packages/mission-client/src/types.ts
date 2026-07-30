import type { MissionSnapshot, ReadinessGateResult, AccountingException } from "@drenyra/mission-domain";

export interface CreateMissionInput {
  companyId: string;
  fiscalPeriod: string;
  intent: "monthly-close" | "correction";
  input: { instruction: string };
}

export interface ExecuteCommand {
  expectedMissionVersion: number;
}

export interface ApprovalInput {
  proposalId: string;
  proposalVersion: number;
  evidenceHash: string;
  expectedMissionVersion: number;
}

export interface RejectInput {
  proposalId: string;
  proposalVersion: number;
  reason: string;
  expectedMissionVersion: number;
}

export interface ReconcileInput {
  resolution: "RUNNING" | "FAILED" | "COMPLETED";
  reason: string;
  expectedMissionVersion: number;
}

export interface ApprovalResult {
  receiptId: string;
  receiptHash: string;
  version: number;
}

export interface ReceiptVerification {
  valid: boolean;
  receiptHash: string;
  computedHash: string;
  missionId: string;
}

export interface MissionSummary {
  id: string;
  status: string;
  intent: string;
  fiscalPeriod: string;
  companyId: string;
  version: number;
  createdAt: string;
}

export interface MissionFilter {
  companyId?: string;
  status?: string;
  intent?: string;
}

export interface MissionClient {
  create(input: CreateMissionInput): Promise<MissionSnapshot>;
  get(id: string): Promise<MissionSnapshot>;
  list(filter?: MissionFilter): Promise<MissionSummary[]>;
  execute(id: string, command: ExecuteCommand): AsyncGenerator<MissionSnapshot>;
  approve(id: string, approval: ApprovalInput): Promise<ApprovalResult>;
  reject(id: string, input: RejectInput): Promise<void>;
  reconcile(id: string, input: ReconcileInput): Promise<MissionSnapshot>;
  getGates(id: string): Promise<ReadinessGateResult[]>;
  getExceptions(id: string): Promise<AccountingException[]>;
  verifyReceipt(missionId: string): Promise<ReceiptVerification>;
}
