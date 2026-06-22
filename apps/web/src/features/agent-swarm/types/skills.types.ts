/**
 * @fileoverview Definición de Skills Agénticos para ARKELYTHEX.
 * Inspirado en la arquitectura composable de OpenClaw.
 */

export type SkillCategory = 'fiscal' | 'finance' | 'operations' | 'audit';

export interface AccountingSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  isInstalled: boolean;
  rules?: string[]; // Referencias a .agents/rules/sunat-2026.md
  inputSchema: Record<string, unknown>;
  outputArtifact: 'table' | 'chart' | 'simulation' | 'report';
}

export interface SkillExecutionLog {
  skillId: string;
  timestamp: string;
  status: 'success' | 'failed';
  result: unknown;
  energyConsumption: number; // Latencia o tokens
}
