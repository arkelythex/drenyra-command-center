import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvoiceValidationWorkflow } from '../../workflows/invoice-validation.workflow';
import { OrchestratorService } from '../../orchestrator/orchestrator.service';
import { SUNATAgent } from '../../agents/sunat.agent';
import type { InvoiceData, ValidationResult } from '../../config/types';

function buildInvoice(id: string): InvoiceData {
  return {
    id,
    ruc: '20100070970',
    serie: 'F001',
    numero: id.replace(/\D/g, '').padStart(8, '0').slice(-8),
    fecha: '2026-02-18',
    moneda: 'PEN',
    subtotal: 100,
    igv: 18,
    total: 118,
    items: [],
  };
}

function validValidation(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    confidence: 0.95,
  };
}

describe('InvoiceValidationWorkflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENROUTER_API_KEY = '';
  });

  it('executes sequentially when orchestrator disables parallelization', async () => {
    vi.spyOn(OrchestratorService.prototype, 'analyzeTask').mockResolvedValue({
      shouldParallelize: false,
      batchSize: 1,
      estimatedCost: 0.01,
      estimatedTime: 30,
      agentsRequired: ['sunat'],
    });

    const validateSpy = vi.spyOn(SUNATAgent.prototype, 'validateInvoice').mockResolvedValue({
      success: true,
      data: validValidation(),
      metadata: {
        agentType: 'sunat',
        modelUsed: 'mock',
        tokensUsed: 0,
        costUsd: 0,
        durationMs: 1,
        timestamp: new Date(),
      },
    });

    const workflow = new InvoiceValidationWorkflow();
    const output = await workflow.execute({
      invoices: [buildInvoice('INV-1'), buildInvoice('INV-2')],
      priority: 'medium',
    });

    expect(output.execution.parallelized).toBe(false);
    expect(output.totalProcessed).toBe(2);
    expect(output.totalValid).toBe(2);
    expect(validateSpy).toHaveBeenCalledTimes(2);
  });

  it('executes in parallel batches when orchestrator enables parallelization', async () => {
    vi.spyOn(OrchestratorService.prototype, 'analyzeTask').mockResolvedValue({
      shouldParallelize: true,
      batchSize: 2,
      estimatedCost: 0.03,
      estimatedTime: 30,
      agentsRequired: ['sunat'],
    });

    const validateSpy = vi.spyOn(SUNATAgent.prototype, 'validateInvoice').mockResolvedValue({
      success: true,
      data: validValidation(),
      metadata: {
        agentType: 'sunat',
        modelUsed: 'mock',
        tokensUsed: 0,
        costUsd: 0,
        durationMs: 1,
        timestamp: new Date(),
      },
    });

    const workflow = new InvoiceValidationWorkflow();
    const output = await workflow.execute({
      invoices: [buildInvoice('INV-11'), buildInvoice('INV-12'), buildInvoice('INV-13')],
      priority: 'high',
    });

    expect(output.execution.parallelized).toBe(true);
    expect(output.execution.batchSize).toBe(2);
    expect(output.results).toHaveLength(3);
    expect(validateSpy).toHaveBeenCalledTimes(3);
  });

  it('maps agent failures into deterministic VALIDATION_FAILED result', async () => {
    vi.spyOn(OrchestratorService.prototype, 'analyzeTask').mockResolvedValue({
      shouldParallelize: false,
      batchSize: 1,
      estimatedCost: 0.01,
      estimatedTime: 30,
      agentsRequired: ['sunat'],
    });

    vi.spyOn(SUNATAgent.prototype, 'validateInvoice').mockResolvedValue({
      success: false,
      error: {
        code: 'SUNAT_DOWN',
        message: 'SUNAT service unavailable',
      },
      metadata: {
        agentType: 'sunat',
        modelUsed: 'mock',
        tokensUsed: 0,
        costUsd: 0,
        durationMs: 1,
        timestamp: new Date(),
      },
    });

    const workflow = new InvoiceValidationWorkflow();
    const output = await workflow.execute({
      invoices: [buildInvoice('INV-ERR-1')],
      priority: 'low',
    });

    expect(output.totalProcessed).toBe(1);
    expect(output.totalInvalid).toBe(1);
    expect(output.results[0].validation.errors[0]).toMatchObject({
      code: 'VALIDATION_FAILED',
      message: 'SUNAT service unavailable',
    });
  });
});
