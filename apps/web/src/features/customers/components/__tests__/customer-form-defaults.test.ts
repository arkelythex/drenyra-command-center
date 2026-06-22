import { describe, expect, it } from 'vitest';
import { buildCustomerFormDefaults } from '../customer-form-defaults';

describe('buildCustomerFormDefaults', () => {
  it('uses the active company as default for new customers', () => {
    expect(buildCustomerFormDefaults('company-1')).toEqual(
      expect.objectContaining({
        companyId: 'company-1',
        creditDays: 30,
        status: 'active',
      }),
    );
  });

  it('preserves an explicit companyId when provided in default values', () => {
    expect(
      buildCustomerFormDefaults('company-1', {
        companyId: 'company-2',
        legalName: 'Cliente Existente',
      }),
    ).toEqual(
      expect.objectContaining({
        companyId: 'company-2',
        legalName: 'Cliente Existente',
      }),
    );
  });
});
