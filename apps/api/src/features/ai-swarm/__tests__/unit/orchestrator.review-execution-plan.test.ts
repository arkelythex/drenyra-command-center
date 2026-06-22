import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BaseTask, TaskAnalysis } from '../../config/types';

const task: BaseTask = {
  id: 'task-1',
  type: 'INVOICE',
  priority: 'high',
  status: 'pending',
  createdAt: new Date('2026-02-18T00:00:00.000Z'),
  updatedAt: new Date('2026-02-18T00:00:00.000Z'),
  metadata: { fileCount: 8 },
};

const analysis: TaskAnalysis = {
  shouldParallelize: true,
  batchSize: 5,
  estimatedCost: 0.1,
  estimatedTime: 60,
  agentsRequired: ['ocr', 'sunat', 'pcge', 'evidence'],
};

async function loadOrchestratorWithMocks(options: {
  hasKey: boolean;
  generateTextImpl?: ReturnType<typeof vi.fn>;
  loggerErrorSpy?: ReturnType<typeof vi.fn>;
}) {
  vi.resetModules();

  if (options.generateTextImpl) {
    vi.doMock('ai', () => ({
      generateText: options.generateTextImpl,
    }));
  }

  vi.doMock('../../config/openrouter.config', async () => {
    const actual = await vi.importActual<typeof import('../../config/openrouter.config')>(
      '../../config/openrouter.config',
    );
    return {
      ...actual,
      hasOpenRouterKey: () => options.hasKey,
      openrouter: vi.fn(() => ({ provider: 'mock' })),
      getModelForAgent: vi.fn(() => 'mock/orchestrator-model'),
    };
  });

  if (options.loggerErrorSpy) {
    vi.doMock('../../../../lib/logger', () => ({
      createLogger: vi.fn(() => ({
        error: options.loggerErrorSpy,
      })),
    }));
  }

  return import('../../orchestrator/orchestrator.service');
}

describe('OrchestratorService.reviewExecutionPlan', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('ai');
    vi.doUnmock('../../config/openrouter.config');
    vi.doUnmock('../../../../lib/logger');
  });

  it('skips AI review when API key is missing', async () => {
    const { OrchestratorService } = await loadOrchestratorWithMocks({
      hasKey: false,
    });

    const orchestrator = new OrchestratorService();
    const result = await orchestrator.reviewExecutionPlan(task, analysis);

    expect(result).toEqual({
      approved: true,
      feedback: 'Skipped: OPENROUTER_API_KEY not configured.',
    });
  });

  it('parses AI response when provider returns valid JSON', async () => {
    const generateText = vi.fn(async () => ({
      text: JSON.stringify({ approved: false, feedback: 'Reduce cost' }),
    }));

    const { OrchestratorService } = await loadOrchestratorWithMocks({
      hasKey: true,
      generateTextImpl: generateText,
    });

    const orchestrator = new OrchestratorService();
    const result = await orchestrator.reviewExecutionPlan(task, analysis);

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ approved: false, feedback: 'Reduce cost' });
  });

  it('fails safe to approved=true when AI response cannot be parsed', async () => {
    const errorSpy = vi.fn();
    const generateText = vi.fn(async () => ({
      text: 'invalid json',
    }));

    const { OrchestratorService } = await loadOrchestratorWithMocks({
      hasKey: true,
      generateTextImpl: generateText,
      loggerErrorSpy: errorSpy,
    });

    const orchestrator = new OrchestratorService();
    const result = await orchestrator.reviewExecutionPlan(task, analysis);

    expect(result).toEqual({ approved: true });
    expect(errorSpy).toHaveBeenCalled();
  });
});
