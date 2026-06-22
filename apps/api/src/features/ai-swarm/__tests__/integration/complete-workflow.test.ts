/**
 * Complete Workflow Integration Tests
 *
 * Tests the full pipeline with multiple agents
 *
 * @module ai-swarm/__tests__/integration
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';

type WorkflowModule = typeof import('../../workflows/complete-invoice-processing.workflow');
let WorkflowClass: WorkflowModule['CompleteInvoiceProcessingWorkflow'];

describe('CompleteInvoiceProcessingWorkflow', () => {
  beforeAll(async () => {
    // Prevent accidental paid network calls during tests.
    // This suite validates orchestration behavior in "offline" mode.
    process.env.OPENROUTER_API_KEY = '';
    vi.resetModules();

    ({ CompleteInvoiceProcessingWorkflow: WorkflowClass } = await import(
      '../../workflows/complete-invoice-processing.workflow'
    ));
  });

  describe('execute', () => {
    it('should process single document sequentially', async () => {
      const workflow = new WorkflowClass();

      // Mock image URL (base64 data URI of a simple test image)
      const testImageUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await workflow.execute({
        documents: [
          {
            id: 'DOC-001',
            imageUrl: testImageUrl,
            filename: 'test-invoice.pdf',
            mimeType: 'application/pdf',
          },
        ],
        priority: 'medium',
      });

      expect(result.totalProcessed).toBe(1);
      expect(result.execution.parallelized).toBe(false);
      expect(result.execution.agentsUsed).toContain('ocr');
      expect(result.execution.agentsUsed).toContain('sunat');
      expect(result.execution.agentsUsed).toContain('pcge');
      expect(result.execution.agentsUsed).toContain('evidence');
    });

    it('should process multiple documents in parallel', async () => {
      const workflow = new WorkflowClass();

      const testImageUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `DOC-${i + 1}`,
        imageUrl: testImageUrl,
        filename: `invoice-${i + 1}.pdf`,
        mimeType: 'application/pdf',
      }));

      const result = await workflow.execute({
        documents,
        priority: 'high',
      });

      expect(result.totalProcessed).toBe(10);
      expect(result.execution.parallelized).toBe(true);
      expect(result.execution.batchSize).toBe(5);
      expect(result.results).toHaveLength(10);
    });

    it('should track costs across all agents', async () => {
      const workflow = new WorkflowClass();

      const testImageUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await workflow.execute({
        documents: [
          {
            id: 'DOC-001',
            imageUrl: testImageUrl,
            filename: 'test-invoice.pdf',
            mimeType: 'application/pdf',
          },
        ],
        priority: 'medium',
      });

      expect(result.execution.totalCostUsd).toBeGreaterThanOrEqual(0);
      expect(result.execution.totalDurationMs).toBeGreaterThanOrEqual(0);

      // Check per-agent costs
      const doc = result.results[0];
      expect(doc.ocr.costUsd).toBeGreaterThanOrEqual(0);
      expect(doc.sunat.costUsd).toBeGreaterThanOrEqual(0);
      expect(doc.pcge.costUsd).toBeGreaterThanOrEqual(0);
    });

    it('should handle OCR failures gracefully', async () => {
      const workflow = new WorkflowClass();

      const result = await workflow.execute({
        documents: [
          {
            id: 'DOC-INVALID',
            imageUrl: 'invalid-url',
            filename: 'invalid.pdf',
            mimeType: 'application/pdf',
          },
        ],
        priority: 'medium',
      });

      expect(result.totalProcessed).toBe(1);

      const doc = result.results[0];

      // OCR should fail with invalid URL
      // SUNAT and PCGE should not run if OCR fails
      expect(doc.ocr.success).toBe(false);
    });
  });
});
