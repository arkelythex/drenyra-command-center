export type DrenyraAgentType = "sire" | "cpe" | "ledger" | "conciliation" | "fiscal-reviewer" | "evidence";

export interface AgentDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

export const DRENYRA_AGENTS: AgentDefinition[] = [
  { id: "sire", label: "Validador SIRE", description: "Validación y reportes SIRE" },
  { id: "cpe", label: "Revisor CPE", description: "Revisión de Comprobantes" },
  { id: "ledger", label: "Contabilizador", description: "Asientos y ledger" },
  { id: "conciliation", label: "Conciliador", description: "Conciliaciones bancarias" },
  { id: "fiscal-reviewer", label: "Revisor Fiscal", description: "Revisión fiscal general" },
  { id: "evidence", label: "Gestor Evidencia", description: "Gestión de evidencia" },
];

export const AGENT_LABELS: Record<DrenyraAgentType, string> = {
  sire: "Validador SIRE",
  cpe: "Revisor CPE",
  ledger: "Contabilizador",
  conciliation: "Conciliador",
  "fiscal-reviewer": "Revisor Fiscal",
  evidence: "Gestor Evidencia",
};
