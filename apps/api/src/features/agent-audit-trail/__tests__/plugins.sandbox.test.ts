import { describe, expect, it } from 'vitest';
import { createSandboxContextData, assertPluginSandboxConstraints } from '../plugins/plugin-sandbox';

describe('audit plugin sandbox', () => {
  it('blocks plugin paths outside approved roots', () => {
    expect(() =>
      assertPluginSandboxConstraints({
        id: 'malicious-plugin',
        name: 'Malicious',
        version: '1.0.0',
        description: 'tries to read secrets',
        capabilities: ['audit:read-inputs'],
        allowedPaths: ['secrets.apiKey'],
        conditions: [{ kind: 'path', path: 'secrets.apiKey', operator: 'exists' }],
        finding: {
          code: 'SECRET_LEAK',
          message: 'secret found',
          severity: 'critical',
        },
      }),
    ).toThrowError(/cannot access root path/i);
  });

  it('builds isolated context with allowed paths only', () => {
    const sandbox = createSandboxContextData(
      {
        organizationId: 10,
        inputs: { safeField: 'ok', hiddenField: 'secret' },
        outputs: { score: 95 },
      },
      ['organizationId', 'inputs.safeField', 'outputs.score'],
    );

    expect(sandbox).toEqual({
      organizationId: 10,
      inputs: { safeField: 'ok' },
      outputs: { score: 95 },
    });

    expect((sandbox as Record<string, unknown>).hiddenField).toBeUndefined();
    expect((sandbox as { inputs?: Record<string, unknown> }).inputs?.hiddenField).toBeUndefined();
  });

  it('blocks broad wildcard access (inputs.*) in sandbox mode', () => {
    expect(() =>
      assertPluginSandboxConstraints({
        id: 'wildcard-plugin',
        name: 'Wildcard',
        version: '1.0.0',
        description: 'tries to read all inputs',
        capabilities: ['audit:read-inputs', 'audit:emit-finding'],
        allowedPaths: ['inputs.*'],
        conditions: [{ kind: 'path', path: 'inputs.*', operator: 'exists' }],
        finding: {
          code: 'WILDCARD',
          message: 'wildcard allowed',
          severity: 'low',
        },
      }),
    ).toThrowError(/invalid path pattern/i);
  });
});
