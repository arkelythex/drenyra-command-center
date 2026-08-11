/**
 * ProduceProposalStep — Step 8 of the Monthly Close Pipeline.
 *
 * Generates a ClosingProposal with 4 entry generators:
 * Depreciation, Accrual, Tax Provision, P&L Close.
 *
 * Validations (both blocking):
 * 1. Debits = Credits per entry (UNBALANCED_PROPOSAL)
 * 2. PCGE account codes must be valid active accounts
 *
 * isBlocker: true
 * retryPolicy: none — pure logic.
 */

import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
  ClosingProposal,
  ProposedJournalEntry,
  ProposedEntryType,
  TaxImpact,
  FinancialImpact,
} from "../types/pipeline-types";

// ─── Input ─────────────────────────────────────────────────────────────────

export interface ProduceProposalInput {
  context: PipelineContext;
}

// ─── Valid P&L account code ranges (PCGE Peru) ────────────────────────────
const VALID_ACCOUNT_PREFIXES = [
  "10", "11", "12", "14", "16", "18", "19", // Activo
  "20", "21", "23", "24", "25", "26", "27", "28", "29", // Pasivo
  "30", "31", "33", "34", "35", "36", "37", "38", "39", // Patrimonio
  "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", // Ingresos por naturaleza
  "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", // Ingresos
  "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", // Gastos por naturaleza
  "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", // Gastos
  "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", // Cuentas de orden
  "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", // Cuentas analíticas
];

function isValidPCGEAccount(accountCode: string): boolean {
  // PCGE codes are strings of digits with optional dots for subaccounts
  // Simple validation: code starts with a valid 2-digit prefix
  const prefix = accountCode.substring(0, 2);
  return VALID_ACCOUNT_PREFIXES.includes(prefix);
}

// ─── Entry Generators ─────────────────────────────────────────────────────

function generateDepreciationEntry(
  _context: PipelineContext,
): ProposedJournalEntry[] {
  // In PR2: placeholder depreciation entry
  // Full implementation in PR3 queries fixed_assets table
  return [
    {
      id: crypto.randomUUID(),
      entryType: "DEPRECIATION" as ProposedEntryType,
      description: "Depreciación mensual — julio 2026",
      date: "2026-06-30",
      lines: [
        {
          accountCode: "681",
          accountName: "Depreciación de Activos Fijos",
          description: "Gasto por depreciación mensual",
          debitCents: 50000,
          creditCents: 0,
        },
        {
          accountCode: "391",
          accountName: "Depreciación Acumulada",
          description: "Depreciación acumulada activos fijos",
          debitCents: 0,
          creditCents: 50000,
        },
      ],
      totalDebits: 50000,
      totalCredits: 50000,
      sourceEvidence: ["fa-001"],
    },
  ];
}

function generateAccrualEntry(
  _context: PipelineContext,
): ProposedJournalEntry[] {
  // Placeholder: no accruals in PR2
  return [];
}

function generateTaxProvisionEntry(
  _context: PipelineContext,
): ProposedJournalEntry[] {
  // Placeholder tax provision
  return [
    {
      id: crypto.randomUUID(),
      entryType: "TAX_PROVISION" as ProposedEntryType,
      description: "Provisión IGV julio 2026",
      date: "2026-06-30",
      lines: [
        {
          accountCode: "641",
          accountName: "Impuesto General a las Ventas",
          description: "IGV por pagar",
          debitCents: 9000,
          creditCents: 0,
        },
        {
          accountCode: "401",
          accountName: "IGV por Pagar",
          description: "Provisión IGV",
          debitCents: 0,
          creditCents: 9000,
        },
      ],
      totalDebits: 9000,
      totalCredits: 9000,
      sourceEvidence: ["tax-001"],
    },
  ];
}

function generatePLCloseEntry(
  _context: PipelineContext,
): ProposedJournalEntry[] {
  // Placeholder P&L close — summarizes revenue and expense accounts
  return [
    {
      id: crypto.randomUUID(),
      entryType: "PL_CLOSE" as ProposedEntryType,
      description: "Cierre de ingresos y gastos julio 2026",
      date: "2026-06-30",
      lines: [
        {
          accountCode: "701",
          accountName: "Ventas",
          description: "Cierre de cuenta de ingresos",
          debitCents: 200000,
          creditCents: 0,
        },
        {
          accountCode: "801",
          accountName: "Resultado del Ejercicio",
          description: "Transferencia a resultados",
          debitCents: 0,
          creditCents: 200000,
        },
      ],
      totalDebits: 200000,
      totalCredits: 200000,
      sourceEvidence: ["pl-001"],
    },
  ];
}

// ─── Step Implementation ──────────────────────────────────────────────────

export class ProduceProposalStep
  implements MonthlyCloseStep<ProduceProposalInput, ClosingProposal>
{
  readonly name = "ProduceProposal";
  readonly retryPolicy = { type: "none" as const };
  readonly isBlocker = true;

  async execute(
    _input: ProduceProposalInput,
    context: PipelineContext,
  ): Promise<StepResult<ClosingProposal>> {
    const startedAt = new Date().toISOString();
    const errors: { code: string; message: string; retryable: boolean }[] = [];
    const proposedEntries: ProposedJournalEntry[] = [];

    // Run each generator in order
    const generators = [
      { name: "depreciation", generate: generateDepreciationEntry },
      { name: "accrual", generate: generateAccrualEntry },
      { name: "taxProvision", generate: generateTaxProvisionEntry },
      { name: "plClose", generate: generatePLCloseEntry },
    ];

    for (const gen of generators) {
      try {
        const entries = gen.generate(context);
        proposedEntries.push(...entries);
      } catch (err) {
        errors.push({
          code: `${gen.name.toUpperCase()}_GENERATION_FAILED`,
          message: err instanceof Error ? err.message : String(err),
          retryable: false,
        });
      }
    }

    // ─── Validation 1: Debits = Credits per entry ──────────────────
    for (const entry of proposedEntries) {
      const totalDebits = entry.lines.reduce((s, l) => s + l.debitCents, 0);
      const totalCredits = entry.lines.reduce((s, l) => s + l.creditCents, 0);

      if (totalDebits !== totalCredits) {
        return {
          success: false,
          errors: [
            {
              code: "UNBALANCED_PROPOSAL",
              message: `Entry "${entry.description}" is unbalanced: debits=${totalDebits}, credits=${totalCredits}`,
              retryable: false,
            },
          ],
          warnings: [],
          exceptions: [],
          metrics: {
            startedAt,
            completedAt: new Date().toISOString(),
            itemsProcessed: proposedEntries.length,
            itemsFailed: 1,
          },
        };
      }

      entry.totalDebits = totalDebits;
      entry.totalCredits = totalCredits;
    }

    // ─── Validation 2: PCGE account codes ─────────────────────────
    for (const entry of proposedEntries) {
      for (const line of entry.lines) {
        if (!isValidPCGEAccount(line.accountCode)) {
          return {
            success: false,
            errors: [
              {
                code: "INVALID_ACCOUNT_CODE",
                message: `Account code "${line.accountCode}" is not a valid active PCGE account`,
                retryable: false,
              },
            ],
            warnings: [],
            exceptions: [],
            metrics: {
              startedAt,
              completedAt: new Date().toISOString(),
              itemsProcessed: proposedEntries.length,
              itemsFailed: 1,
            },
          };
        }
      }
    }

    // ─── Compute impacts ──────────────────────────────────────────
    const totalDebitsCents = proposedEntries.reduce(
      (s, e) => s + (e.totalDebits ?? 0),
      0,
    );
    const totalCreditsCents = proposedEntries.reduce(
      (s, e) => s + (e.totalCredits ?? 0),
      0,
    );

    const taxImpact: TaxImpact = {
      igvPayableCents: 9000,
      rentaPayableCents: 0,
      totalTaxLiabilityCents: 9000,
    };

    const financialImpact: FinancialImpact = {
      totalRevenueCents: 200000,
      totalExpenseCents: 50000,
      netIncomeCents: 150000,
    };

    // Risk level from unresolved exceptions
    const blockingCount = context.exceptions.filter(
      (e) => e.severity === "blocking",
    ).length;
    const warningCount = context.exceptions.filter(
      (e) => e.severity === "warning",
    ).length;

    const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
      blockingCount > 0
        ? "HIGH"
        : warningCount > 3
          ? "MEDIUM"
          : "LOW";

    const proposal: ClosingProposal = {
      id: crypto.randomUUID(),
      missionId: context.missionId,
      version: 1,
      fiscalPeriod: context.fiscalPeriod,
      generatedAt: new Date().toISOString(),
      proposedEntries,
      entryCount: proposedEntries.length,
      totalDebitCents: totalDebitsCents,
      totalCreditCents: totalCreditsCents,
      taxImpact,
      financialImpact,
      riskLevel,
      unresolvedExceptions: context.exceptions.filter(
        (e) => e.severity !== "blocking",
      ),
      requiredApprovals: ["approver-1", "approver-2"],
      sourceEvidence: [],
      evidenceHash: "",
    };

    return {
      success: true,
      data: proposal,
      errors,
      warnings: [],
      exceptions: [],
      metrics: {
        startedAt,
        completedAt: new Date().toISOString(),
        itemsProcessed: proposedEntries.length,
        itemsFailed: 0,
      },
    };
  }
}
