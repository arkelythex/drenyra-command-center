import type { ArtifactPolicyGate, ArtifactRiskLevel, PolicyApprovalProof } from '../types/artifact.types';

export interface PolicyGateRequest {
  artifactId: string;
  artifactType: string;
  traceId: string;
  actionId: string;
  actionLabel: string;
  riskLevel: ArtifactRiskLevel;
  policyGate?: ArtifactPolicyGate;
}

export interface PolicyGateResult {
  allowed: boolean;
  proof?: PolicyApprovalProof;
  reason?: string;
}
