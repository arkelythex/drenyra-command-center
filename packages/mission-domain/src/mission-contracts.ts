/**
 * Mission contracts — shared TypeScript types for the mission domain.
 *
 * These interfaces define the shape of commands, events, snapshots,
 * and other shared data structures consumed by both API and frontend.
 */

import type { AccountingMissionStatus } from "./mission-status.js";

// ─── Intent ──────────────────────────────────────────────────────────────────

export type MissionIntent =
  | "monthly-close"
  | "correction"
  | "reconciliation"
  | "invoice-review"
  | "compliance-check";

// ─── Commands ────────────────────────────────────────────────────────────────

export interface RunIntentCommand {
  companyId: string;
  fiscalPeriod: string; // YYYY-MM
  intent: MissionIntent;
  input: { instruction: string };
}

export interface ApproveCommand {
  proposalId: string;
  proposalVersion: number;
  evidenceHash: string; // SHA-256 hex, 64 chars
  expectedMissionVersion: number;
}

export interface RejectCommand {
  proposalId: string;
  proposalVersion: number;
  reason: string; // REQUIRED, non-empty, max 2000 chars
  expectedMissionVersion: number;
}

export interface ReconcileCommand {
  resolution: "RUNNING" | "FAILED" | "COMPLETED";
  reason: string; // REQUIRED, non-empty, max 2000 chars
  expectedMissionVersion: number;
}

// ─── Mission Step ────────────────────────────────────────────────────────────

export interface MissionStep {
  id: string;
  name: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "SKIPPED";
  startedAt?: string;
  completedAt?: string;
  error?: string;
  evidenceIds?: string[];
}

// ─── Evidence Item ───────────────────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  label: string;
  type: string;
}

// ─── Proposal ────────────────────────────────────────────────────────────────

export interface MissionProposal {
  id: string;
  missionId: string;
  version: number;
  evidence: EvidenceItem[];
  evidenceHash: string; // SHA-256 hex of sorted evidence
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  generatedAt: string;
  expiresAt?: string;
}

// ─── Rejection ───────────────────────────────────────────────────────────────

export interface MissionRejection {
  reason: string;
  rejectedBy: string;
  rejectedAt: string;
  proposalVersion: number;
}

// ─── Blocker ─────────────────────────────────────────────────────────────────

export interface MissionBlocker {
  id: string;
  reason: string;
  severity: "WARNING" | "ERROR" | "CRITICAL";
  occurredAt: string;
  resolvedAt?: string;
}

// ─── Snapshot ────────────────────────────────────────────────────────────────

export interface MissionSnapshot {
  id: string;
  companyId: string;
  fiscalPeriod: string;
  intent: MissionIntent;
  status: AccountingMissionStatus;
  version: number;
  progress: number; // integer basis points (0-10000)
  steps: MissionStep[];
  currentStep: string;
  blockers: MissionBlocker[];
  proposal: MissionProposal | null;
  rejection: MissionRejection | null;
  receiptId: string | null;
  receiptHash: string | null;
  lastEventSequence: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Harness Error ───────────────────────────────────────────────────────────

export interface HarnessError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  isTimeout: boolean;
}
