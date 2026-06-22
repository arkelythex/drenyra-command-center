import { afterEach, describe, expect, it } from 'vitest';
import {
  getLedgerMvpAllowedRoles,
  getLedgerMvpAllowedRolesForEndpoint,
  getLedgerMvpTenantAllowlist,
  isCompanyAllowedForLedgerMvp,
  isLedgerMvpEnabled,
  isLedgerMvpRoleAllowed,
  shouldRequireLedgerMvpAuth,
  validateLedgerMvpStartupPolicy,
} from '../../ledger-mvp-rollout.service';

describe('ledger-mvp-rollout.service', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnabled = process.env.LEDGER_MVP_ENABLED;
  const originalEnabledLegacy = process.env.FLUX_MVP_ENABLED;
  const originalRequireAuth = process.env.LEDGER_MVP_REQUIRE_AUTH;
  const originalRequireAuthLegacy = process.env.FLUX_MVP_REQUIRE_AUTH;
  const originalAllowlist = process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS;
  const originalAllowlistLegacy = process.env.FLUX_MVP_ALLOWED_COMPANY_IDS;
  const originalAllowedRoles = process.env.LEDGER_MVP_ALLOWED_ROLES;
  const originalAllowedRolesLegacy = process.env.FLUX_MVP_ALLOWED_ROLES;
  const originalSireRoles = process.env.LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT;
  const originalSireRolesLegacy = process.env.FLUX_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT;
  const originalNpifRoles = process.env.LEDGER_MVP_ALLOWED_ROLES_NPIF_BASIC;
  const originalNpifRolesLegacy = process.env.FLUX_MVP_ALLOWED_ROLES_NPIF_BASIC;
  const originalMonitorRoles = process.env.LEDGER_MVP_ALLOWED_ROLES_MONITOR_FISCAL;
  const originalMonitorRolesLegacy = process.env.FLUX_MVP_ALLOWED_ROLES_MONITOR_FISCAL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LEDGER_MVP_ENABLED = originalEnabled;
    process.env.FLUX_MVP_ENABLED = originalEnabledLegacy;
    process.env.LEDGER_MVP_REQUIRE_AUTH = originalRequireAuth;
    process.env.FLUX_MVP_REQUIRE_AUTH = originalRequireAuthLegacy;
    process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = originalAllowlist;
    process.env.FLUX_MVP_ALLOWED_COMPANY_IDS = originalAllowlistLegacy;
    process.env.LEDGER_MVP_ALLOWED_ROLES = originalAllowedRoles;
    process.env.FLUX_MVP_ALLOWED_ROLES = originalAllowedRolesLegacy;
    process.env.LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT = originalSireRoles;
    process.env.FLUX_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT = originalSireRolesLegacy;
    process.env.LEDGER_MVP_ALLOWED_ROLES_NPIF_BASIC = originalNpifRoles;
    process.env.FLUX_MVP_ALLOWED_ROLES_NPIF_BASIC = originalNpifRolesLegacy;
    process.env.LEDGER_MVP_ALLOWED_ROLES_MONITOR_FISCAL = originalMonitorRoles;
    process.env.FLUX_MVP_ALLOWED_ROLES_MONITOR_FISCAL = originalMonitorRolesLegacy;
  });

  it('disables Ledger MVP by default in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LEDGER_MVP_ENABLED;
    delete process.env.FLUX_MVP_ENABLED;

    expect(isLedgerMvpEnabled()).toBe(false);
  });

  it('reads legacy FLUX_MVP_ENABLED when LEDGER_MVP_ENABLED is unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LEDGER_MVP_ENABLED;
    process.env.FLUX_MVP_ENABLED = 'true';

    expect(isLedgerMvpEnabled()).toBe(true);
  });

  it('requires auth by default in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LEDGER_MVP_REQUIRE_AUTH;
    delete process.env.FLUX_MVP_REQUIRE_AUTH;

    expect(shouldRequireLedgerMvpAuth()).toBe(true);
  });

  it('parses tenant allowlist and blocks non-allowed company', () => {
    process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = 'cmp-1, cmp-2';

    expect(getLedgerMvpTenantAllowlist()).toEqual(['cmp-1', 'cmp-2']);
    expect(isCompanyAllowedForLedgerMvp('cmp-1')).toBe(true);
    expect(isCompanyAllowedForLedgerMvp('cmp-9')).toBe(false);
  });

  it('uses default Ledger MVP allowed roles and supports custom role allowlist', () => {
    delete process.env.LEDGER_MVP_ALLOWED_ROLES;
    delete process.env.FLUX_MVP_ALLOWED_ROLES;
    delete process.env.LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT;
    delete process.env.FLUX_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT;
    delete process.env.LEDGER_MVP_ALLOWED_ROLES_NPIF_BASIC;
    delete process.env.FLUX_MVP_ALLOWED_ROLES_NPIF_BASIC;
    delete process.env.LEDGER_MVP_ALLOWED_ROLES_MONITOR_FISCAL;
    delete process.env.FLUX_MVP_ALLOWED_ROLES_MONITOR_FISCAL;
    expect(getLedgerMvpAllowedRoles()).toEqual(['owner', 'senior', 'admin', 'superadmin']);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'admin')).toBe(true);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'viewer')).toBe(false);

    process.env.LEDGER_MVP_ALLOWED_ROLES = 'admin, accountant';
    expect(getLedgerMvpAllowedRoles()).toEqual(['admin', 'accountant']);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'accountant')).toBe(true);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'owner')).toBe(false);

    process.env.LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT = 'tax-analyst';
    expect(getLedgerMvpAllowedRolesForEndpoint('sire_autopilot_run')).toEqual(['tax-analyst']);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'tax-analyst')).toBe(true);
    expect(isLedgerMvpRoleAllowed('sire_autopilot_run', 'accountant')).toBe(false);
  });

  it('keeps auth required even when the legacy auth flag is disabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.LEDGER_MVP_ENABLED = 'true';
    process.env.LEDGER_MVP_REQUIRE_AUTH = 'false';
    process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = 'cmp-1';

    expect(shouldRequireLedgerMvpAuth()).toBe(true);
    expect(() => validateLedgerMvpStartupPolicy()).not.toThrow();
  });

  it('throws startup error when production enables Ledger MVP without tenant allowlist', () => {
    process.env.NODE_ENV = 'production';
    process.env.LEDGER_MVP_ENABLED = 'true';
    process.env.LEDGER_MVP_REQUIRE_AUTH = 'true';
    process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = '';

    expect(() => validateLedgerMvpStartupPolicy()).toThrow(
      /LEDGER_MVP_ALLOWED_COMPANY_IDS/,
    );
  });

  it('enforces fail-closed startup policy in staging', () => {
    process.env.NODE_ENV = 'staging';
    process.env.LEDGER_MVP_ENABLED = 'true';
    process.env.LEDGER_MVP_REQUIRE_AUTH = 'true';
    process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = '';

    expect(() => validateLedgerMvpStartupPolicy()).toThrow(
      /LEDGER_MVP_ALLOWED_COMPANY_IDS/,
    );
  });
});
