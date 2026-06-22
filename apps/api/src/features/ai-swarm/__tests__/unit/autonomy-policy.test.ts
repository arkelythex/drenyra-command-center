import { afterEach, describe, expect, it } from 'vitest';
import { AutonomyPolicyService } from '../../governance/autonomy-policy.service';

const ORIGINAL_ENV = { ...process.env };

function resetAutonomyEnv(): void {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTONOMY_ENABLED;
  delete process.env.AUTONOMY_GLOBAL_KILL_SWITCH;
  delete process.env.AUTONOMY_MAX_AUTO_EXECUTION_PEN;
  delete process.env.AUTONOMY_MAX_RISK_SCORE;
  delete process.env.AUTONOMY_REQUIRE_APPROVAL_FOR_CRITICAL;
}

afterEach(() => {
  resetAutonomyEnv();
});

describe('AutonomyPolicyService', () => {
  it('blocks execution when global kill switch is active', () => {
    process.env.AUTONOMY_GLOBAL_KILL_SWITCH = 'true';

    const result = AutonomyPolicyService.evaluate({
      action: 'process_invoices',
      priority: 'medium',
    });

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.code).toBe('AUTONOMY_KILL_SWITCH_ACTIVE');
    expect(result.trace.decision).toBe('BLOCK');
  });

  it('requires approval when amount exceeds auto-execution threshold', () => {
    process.env.AUTONOMY_MAX_AUTO_EXECUTION_PEN = '5000';

    const result = AutonomyPolicyService.evaluate({
      action: 'multi_ruc_process',
      priority: 'high',
      estimatedAmountPen: 9000,
    });

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.code).toBe('AUTONOMY_APPROVAL_REQUIRED');
    expect(result.requiresApproval).toBe(true);
  });

  it('allows execution with valid approval override', () => {
    process.env.AUTONOMY_MAX_AUTO_EXECUTION_PEN = '5000';

    const result = AutonomyPolicyService.evaluate({
      action: 'multi_ruc_process',
      priority: 'high',
      estimatedAmountPen: 9000,
      approval: {
        approvedBy: 'controller.lead',
        reason: 'Manual review completed',
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.trace.decision).toBe('ALLOW');
    expect(result.trace.hash).toHaveLength(64);
  });

  it('requires approval when risk is above configured threshold', () => {
    process.env.AUTONOMY_MAX_RISK_SCORE = '0.2';

    const result = AutonomyPolicyService.evaluate({
      action: 'reconcile',
      priority: 'medium',
      riskScore: 0.45,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('AUTONOMY_APPROVAL_REQUIRED');
  });

  it('requires approval for critical tasks by default', () => {
    const result = AutonomyPolicyService.evaluate({
      action: 'process_invoices',
      priority: 'critical',
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('AUTONOMY_APPROVAL_REQUIRED');
  });

  it('allows everything when autonomy is disabled', () => {
    process.env.AUTONOMY_ENABLED = 'false';

    const result = AutonomyPolicyService.evaluate({
      action: 'process_invoices',
      priority: 'critical',
      estimatedAmountPen: 999999,
      riskScore: 0.99,
    });

    expect(result.allowed).toBe(true);
    expect(result.trace.decision).toBe('ALLOW');
  });
});
